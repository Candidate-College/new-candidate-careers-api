import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { UserService } from '@/services/UserService';
import { CreateUserRequest, UpdateUserRequest, QueryParams } from '@/types';
import {
  UserRegistrationRequest,
  UserProfileUpdateRequest,
  EmailVerificationRequest,
} from '@/types/userRegistration';
import { UserRegistrationValidator } from '@/validators/userRegistrationValidator';
import { EmailVerificationValidator } from '@/validators/emailVerificationValidator';
import { formatValidationErrorResponse } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types/jwt';
import { UserRegistrationResource } from '@/resources/userRegistrationResource';
import { UserProfileResource } from '@/resources/userProfileResource';

/**
 * User Controller
 *
 * Handles HTTP requests for user management operations including registration,
 * email verification, profile management, and CRUD operations. Implements
 * proper validation, error handling, and response formatting for all user-related endpoints.
 *
 * @module src/controllers/UserController
 */
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Register a new user (Super Admin only)
   */
  registerUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('User registration request received');

    // Validate registration data
    const validation = UserRegistrationValidator.validateRegistrationRequest(req.body);
    if (!validation.isValid) {
      logger.warn('User registration validation failed:', validation.errors);
      res.status(400).json(formatValidationErrorResponse('Validation failed', validation.errors));
      return;
    }

    const registrationData: UserRegistrationRequest = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    const result = await this.userService.registerUser(registrationData, ipAddress, userAgent);

    if (!result.success) {
      const errorResponse = createErrorResponse(result.error || 'Registration failed');
      res.status(400).json(errorResponse);
      return;
    }

    // Use the resource to format the response
    const response = UserRegistrationResource.formatRegistrationSuccessResponse(
      result.user!,
      result.verificationToken
    );

    logger.info(`User ${result.user!.id} registered successfully`);
    res.status(201).json(response);
  });

  /**
   * Verify email with token
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Email verification request received');

    // Validate verification data
    const validation = EmailVerificationValidator.validateVerifyTokenRequest(req.body);
    if (!validation.isValid) {
      logger.warn('Email verification validation failed:', validation.errors);
      res.status(400).json(formatValidationErrorResponse('Validation failed', validation.errors));
      return;
    }

    const verificationData: EmailVerificationRequest = req.body;
    const ipAddress = req.ip;

    const result = await this.userService.verifyEmailToken(
      verificationData.token,
      verificationData.email,
      ipAddress
    );

    if (!result.success) {
      const errorResponse = createErrorResponse(result.error || 'Email verification failed');
      res.status(400).json(errorResponse);
      return;
    }

    // Use the resource to format the response
    const response = UserRegistrationResource.formatEmailVerificationSuccessResponse(
      result.user!.id,
      new Date()
    );

    logger.info(`Email verified successfully for user ${result.user!.id}`);
    res.status(200).json(response);
  });

  /**
   * Resend verification email
   */
  resendVerificationEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Resend verification email request received');

    const { email } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (!email) {
      const errorResponse = createErrorResponse('Email is required');
      res.status(400).json(errorResponse);
      return;
    }

    const result = await this.userService.resendVerificationEmail(email, ipAddress, userAgent);

    if (!result.success) {
      const errorResponse = createErrorResponse(
        result.error || 'Failed to resend verification email'
      );
      res.status(400).json(errorResponse);
      return;
    }

    // Use the resource to format the response
    const response = UserRegistrationResource.formatResendVerificationSuccessResponse(
      email,
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    );

    logger.info(`Verification email resent to ${email}`);
    res.status(200).json(response);
  });

  /**
   * Get user profile
   */
  getUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      const errorResponse = createErrorResponse('User not authenticated');
      res.status(401).json(errorResponse);
      return;
    }

    const user = await this.userService.getUserProfile(parseInt(userId, 10));

    if (!user) {
      const errorResponse = UserProfileResource.formatProfileNotFoundResponse(parseInt(userId, 10));
      res.status(404).json(errorResponse);
      return;
    }

    // Use the resource to format the response
    const response = UserProfileResource.formatProfileViewSuccessResponse(user);

    logger.info(`User profile retrieved for user ${userId}`);
    res.status(200).json(response);
  });

  /**
   * Update user profile
   */
  updateUserProfile = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const userId = req.user?.id;
      if (!userId) {
        const errorResponse = createErrorResponse('User not authenticated');
        res.status(401).json(errorResponse);
        return;
      }

      // Validate update data
      const validation = UserRegistrationValidator.validateProfileUpdateRequest(req.body);
      if (!validation.isValid) {
        logger.warn('Profile update validation failed:', validation.errors);
        res.status(400).json(formatValidationErrorResponse('Validation failed', validation.errors));
        return;
      }

      const updateData: UserProfileUpdateRequest = req.body;
      const result = await this.userService.updateUserProfile(
        parseInt(userId, 10),
        updateData,
        parseInt(userId, 10)
      );

      if (!result.success) {
        const errorResponse = UserProfileResource.formatProfileUpdateErrorResponse(
          result.error || 'Profile update failed'
        );
        res.status(400).json(errorResponse);
        return;
      }

      // Use the resource to format the response
      const response = UserProfileResource.formatProfileUpdateSuccessResponse(result.user!);

      logger.info(`User profile updated for user ${userId}`);
      res.status(200).json(response);
    }
  );

  // Get all users with pagination
  getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const queryParams: QueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: (req.query.sort as string) || 'created_at',
      order: (req.query.order as 'asc' | 'desc') || 'desc',
      search: req.query.search as string,
    };

    const result = await this.userService.getUsers(queryParams);
    res.status(200).json(result);
  });

  // Get user by ID
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      const errorResponse = createErrorResponse('User ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      const errorResponse = createErrorResponse('Invalid user ID');
      res.status(400).json(errorResponse);
      return;
    }

    const user = await this.userService.getUserById(userId);

    if (!user) {
      const errorResponse = createErrorResponse('User not found');
      res.status(404).json(errorResponse);
      return;
    }

    const response = createSuccessResponse('User retrieved successfully', user);
    res.status(200).json(response);
  });

  // Create new user
  createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData: CreateUserRequest = req.body;
    const user = await this.userService.createUser(userData);
    const response = createSuccessResponse('User created successfully', user);
    res.status(201).json(response);
  });

  // Update user
  updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData: UpdateUserRequest = req.body;

    if (!id) {
      const errorResponse = createErrorResponse('User ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      const errorResponse = createErrorResponse('Invalid user ID');
      res.status(400).json(errorResponse);
      return;
    }

    const user = await this.userService.updateUser(userId, updateData);

    if (!user) {
      const errorResponse = createErrorResponse('User not found');
      res.status(404).json(errorResponse);
      return;
    }

    const response = createSuccessResponse('User updated successfully', user);
    res.status(200).json(response);
  });

  // Delete user
  deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      const errorResponse = createErrorResponse('User ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      const errorResponse = createErrorResponse('Invalid user ID');
      res.status(400).json(errorResponse);
      return;
    }

    const deleted = await this.userService.deleteUser(userId);

    if (!deleted) {
      const errorResponse = createErrorResponse('User not found');
      res.status(404).json(errorResponse);
      return;
    }

    const response = createSuccessResponse('User deleted successfully');
    res.status(200).json(response);
  });
}
