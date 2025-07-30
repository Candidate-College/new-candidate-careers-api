import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  QueryParams,
  PaginatedResponse,
} from '@/types';
import { UserRegistrationRequest, UserProfileUpdateRequest } from '@/types/userRegistration';
import { createPaginatedResponse, calculatePaginationMeta } from '@/utils/response';
import { createError } from '@/middleware/errorHandler';
import { UserModel } from '@/models';
import { PasswordUtils } from '@/utils/password';
import { UserRegistrationValidator } from '@/validators/userRegistrationValidator';
import { PasswordValidator } from '@/validators/passwordValidator';
import { EmailVerificationService } from './EmailVerificationService';
import { AuditLogService } from './AuditLogService';
import { logger } from '@/utils/logger';
import { SUPER_ADMIN_ROLE_ID } from '@/types/roles';

export class UserService {
  private readonly userModel: UserModel;
  private readonly emailVerificationService: EmailVerificationService;
  private readonly auditLogService: AuditLogService;

  constructor() {
    this.userModel = new UserModel();
    this.emailVerificationService = new EmailVerificationService();
    this.auditLogService = new AuditLogService();
  }

  async getUsers(queryParams: QueryParams): Promise<PaginatedResponse<User[]>> {
    const { data: users, total } = await this.userModel.findAll(queryParams);
    const { page = 1, limit = 10 } = queryParams;

    const meta = calculatePaginationMeta(page, limit, total);
    return createPaginatedResponse(users, meta, 'Users retrieved successfully');
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.userModel.findById(id);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // Hash password before creating user
      const hashedPassword = await PasswordUtils.hashPassword(userData.password);

      return await this.userModel.createUser({
        ...userData,
        password: hashedPassword,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Email already exists') {
        throw createError('Email already exists', 409);
      }
      if (errorMessage === 'Username already exists') {
        throw createError('Username already exists', 409);
      }
      throw error;
    }
  }

  async updateUser(id: number, updateData: UpdateUserRequest): Promise<User | null> {
    try {
      return await this.userModel.updateUser(id, updateData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Email already exists') {
        throw createError('Email already exists', 409);
      }
      if (errorMessage === 'Username already exists') {
        throw createError('Username already exists', 409);
      }
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    return await this.userModel.delete(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userModel.findByEmail(email);
  }

  async getUserByEmailWithPassword(
    email: string
  ): Promise<(User & { password_hash: string }) | null> {
    return await this.userModel.findByEmailWithPassword(email);
  }

  // Note: Username functionality has been removed as per current User model
  // Users are now identified by email only

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    recentlyCreated: number;
  }> {
    return await this.userModel.getUserStats();
  }

  async deactivateUser(id: number): Promise<User | null> {
    return await this.userModel.deactivateUser(id);
  }

  async activateUser(id: number): Promise<User | null> {
    return await this.userModel.activateUser(id);
  }

  /**
   * Register new user with email verification
   */
  async registerUser(
    registrationData: UserRegistrationRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    error?: string;
    user?: User;
    verificationToken?: string;
  }> {
    try {
      // Validate registration data
      const validation = UserRegistrationValidator.validateRegistrationRequest(registrationData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors[0]?.message || 'Invalid registration data',
        };
      }

      const sanitizedData = UserRegistrationValidator.sanitizeRegistrationData(registrationData);

      // Check if email already exists
      const existingUser = await this.userModel.findByEmail(sanitizedData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'Email already exists',
        };
      }

      // Validate password complexity
      const passwordValidation = PasswordValidator.validatePassword(sanitizedData.password, {
        userInfo: {
          email: sanitizedData.email,
          name: sanitizedData.name,
        },
      });

      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors[0] || 'Password does not meet requirements',
        };
      }

      // Hash password
      const hashedPassword = await PasswordUtils.hashPassword(sanitizedData.password);

      // Create user
      const newUser = await this.userModel.createUser({
        email: sanitizedData.email,
        name: sanitizedData.name,
        password: hashedPassword,
        role_id: sanitizedData.role_id,
      });

      // Create email verification token
      const tokenResult = await this.emailVerificationService.createToken({
        user_id: newUser.id,
        type: 'email_verification',
        ip_address: ipAddress || '',
        user_agent: userAgent || '',
      });

      // Log registration event
      await this.auditLogService.logUserRegistration(
        newUser.id,
        sanitizedData as unknown as Record<string, unknown>,
        ipAddress,
        userAgent
      );

      logger.info(`User ${newUser.id} registered successfully`);

      const result: {
        success: boolean;
        error?: string;
        user?: User;
        verificationToken?: string;
      } = {
        success: true,
        user: newUser,
      };

      if (tokenResult.token?.token) {
        result.verificationToken = tokenResult.token.token;
      }

      return result;
    } catch (error) {
      logger.error('User registration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: number,
    updateData: UserProfileUpdateRequest,
    currentUserId: number
  ): Promise<{
    success: boolean;
    error?: string;
    user?: User;
  }> {
    try {
      // Validate update data
      const validation = UserRegistrationValidator.validateProfileUpdateRequest(updateData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors[0]?.message || 'Invalid profile update data',
        };
      }

      const sanitizedData = UserRegistrationValidator.sanitizeProfileUpdateData(updateData);

      // Check if user exists
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Check authorization (only Super Admin can update other users)
      if (userId !== currentUserId) {
        const currentUser = await this.userModel.findById(currentUserId);
        if (!currentUser || currentUser.role_id !== SUPER_ADMIN_ROLE_ID) {
          // Assuming role_id 1 is Super Admin
          return {
            success: false,
            error: 'Unauthorized to update other users',
          };
        }
      }

      // Prepare update data
      const updatePayload: Partial<User> = {};

      if (sanitizedData.name) {
        updatePayload.name = sanitizedData.name;
      }

      // Handle password change if provided
      if (sanitizedData.current_password && sanitizedData.new_password) {
        // Verify current password
        const userWithPassword = await this.userModel.findByEmailWithPassword(existingUser.email);
        if (!userWithPassword) {
          return {
            success: false,
            error: 'User not found',
          };
        }

        const isCurrentPasswordValid = await PasswordUtils.verifyPassword(
          sanitizedData.current_password,
          userWithPassword.password_hash
        );

        if (!isCurrentPasswordValid) {
          return {
            success: false,
            error: 'Current password is incorrect',
          };
        }

        // Validate new password
        const passwordValidation = PasswordValidator.validatePassword(sanitizedData.new_password, {
          userInfo: {
            email: existingUser.email,
            name: existingUser.name,
          },
        });

        if (!passwordValidation.isValid) {
          return {
            success: false,
            error: passwordValidation.errors[0] || 'New password does not meet requirements',
          };
        }

        // Hash new password
        const hashedNewPassword = await PasswordUtils.hashPassword(sanitizedData.new_password);
        updatePayload.password = hashedNewPassword;
      }

      // Update user
      const updatedUser = await this.userModel.updateUser(userId, updatePayload);

      if (!updatedUser) {
        return {
          success: false,
          error: 'Failed to update user',
        };
      }

      // Log profile update event
      await this.auditLogService.logProfileUpdate(
        userId,
        sanitizedData as unknown as Record<string, unknown>,
        true
      );

      // Log password change if applicable
      if (sanitizedData.new_password) {
        await this.auditLogService.logPasswordChange(userId, true);
      }

      logger.info(`User ${userId} profile updated successfully`);

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      logger.error(`Profile update failed for user ${userId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
      };
    }
  }

  /**
   * Verify email verification token
   */
  async verifyEmailToken(
    token: string,
    email: string,
    ipAddress?: string
  ): Promise<{
    success: boolean;
    error?: string;
    user?: User;
  }> {
    try {
      // Verify token
      const verificationResult = await this.emailVerificationService.verifyToken({
        token,
        email,
      });

      if (!verificationResult.success) {
        // Log failed verification
        await this.auditLogService.logEmailVerification(
          0, // Unknown user ID
          false,
          verificationResult.error,
          ipAddress
        );

        return {
          success: false,
          error: verificationResult.error || 'Verification failed',
        };
      }

      // Get user by email
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Log successful verification
      await this.auditLogService.logEmailVerification(user.id, true, undefined, ipAddress);

      logger.info(`Email verified for user ${user.id}`);

      return {
        success: true,
        user,
      };
    } catch (error) {
      logger.error('Email verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email verification failed',
      };
    }
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Find user by email
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Check if email is already verified
      if (user.email_verified_at) {
        return {
          success: false,
          error: 'Email is already verified',
        };
      }

      // Create new verification token
      const tokenRequest: any = {
        user_id: user.id,
        type: 'email_verification',
      };

      if (ipAddress) {
        tokenRequest.ip_address = ipAddress;
      }

      if (userAgent) {
        tokenRequest.user_agent = userAgent;
      }

      const tokenResult = await this.emailVerificationService.createToken(tokenRequest);

      if (!tokenResult.success) {
        return {
          success: false,
          error: tokenResult.error || 'Failed to create verification token',
        };
      }

      // Send verification email
      const emailSent = await this.emailVerificationService.sendVerificationEmail(
        user.id,
        tokenResult.token!.token,
        user.email
      );

      if (!emailSent) {
        return {
          success: false,
          error: 'Failed to send verification email',
        };
      }

      logger.info(`Verification email resent to user ${user.id}`);

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Failed to resend verification email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend verification email',
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: number): Promise<User | null> {
    return await this.userModel.findById(userId);
  }
}
