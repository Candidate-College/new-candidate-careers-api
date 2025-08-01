import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { EmailVerificationService } from '@/services/EmailVerificationService';
import { UserService } from '@/services/UserService';
import { EmailVerificationValidator } from '@/validators/emailVerificationValidator';
import { formatValidationErrorResponse } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { EmailVerificationRequest } from '@/types/userRegistration';
import { EmailVerificationResource } from '@/resources/emailVerificationResource';

/**
 * Email Verification Controller
 *
 * Handles HTTP requests for email verification operations including token
 * verification, token generation, and email sending. Implements proper
 * validation, error handling, and response formatting for all email
 * verification-related endpoints.
 *
 * @module src/controllers/EmailVerificationController
 */
export class EmailVerificationController {
  private readonly emailVerificationService: EmailVerificationService;
  private readonly userService: UserService;

  constructor() {
    this.emailVerificationService = new EmailVerificationService();
    this.userService = new UserService();
  }

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

    logger.info(
      `Attempting to verify email with token: ${verificationData.token.substring(0, 8)}...`
    );

    const result = await this.emailVerificationService.verifyToken({
      token: verificationData.token,
      email: verificationData.email,
    });

    if (!result.success) {
      logger.warn(`Email verification failed: ${result.error}`);
      const errorResponse = EmailVerificationResource.formatVerificationErrorApiResponse(
        result.error || 'Email verification failed',
        400
      );
      res.status(400).json(errorResponse);
      return;
    }

    // Use the resource to format the response
    const response = EmailVerificationResource.formatVerificationSuccessApiResponse(
      result.user_id!,
      new Date()
    );

    logger.info(`Email verified successfully for user ${result.user_id}`);
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

    // For resend, we need to create a new token and send email
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      const errorResponse = createErrorResponse('User not found');
      res.status(404).json(errorResponse);
      return;
    }

    const tokenResult = await this.emailVerificationService.createToken({
      user_id: user.id,
      type: 'email_verification',
      ip_address: ipAddress || '',
      user_agent: userAgent || '',
    });

    if (!tokenResult.success) {
      const errorResponse = EmailVerificationResource.formatVerificationErrorApiResponse(
        tokenResult.error || 'Failed to create verification token',
        400
      );
      res.status(400).json(errorResponse);
      return;
    }

    // Send verification email
    const emailSent = await this.emailVerificationService.sendVerificationEmail(
      user.id,
      tokenResult.token!.token,
      user.email,
      user.name
    );

    if (!emailSent) {
      const errorResponse = EmailVerificationResource.formatVerificationErrorApiResponse(
        'Failed to send verification email',
        500
      );
      res.status(500).json(errorResponse);
      return;
    }

    // Use the resource to format the response
    const response = EmailVerificationResource.formatResendVerificationSuccessApiResponse(
      email,
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    );

    logger.info(`Verification email resent to user ${user.id}`);
    res.status(200).json(response);
  });

  /**
   * Create verification token
   */
  createVerificationToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Create verification token request received');

    // Validate token creation data
    const validation = EmailVerificationValidator.validateCreateTokenRequest(req.body);
    if (!validation.isValid) {
      logger.warn('Token creation validation failed:', validation.errors);
      res.status(400).json(formatValidationErrorResponse('Validation failed', validation.errors));
      return;
    }

    const tokenData = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    const result = await this.emailVerificationService.createToken({
      user_id: tokenData.user_id,
      type: tokenData.type,
      ip_address: ipAddress || '',
      user_agent: userAgent || '',
      expires_in_hours: tokenData.expires_in_hours,
    });

    if (!result.success) {
      const errorResponse = createErrorResponse(
        result.error || 'Failed to create verification token'
      );
      res.status(400).json(errorResponse);
      return;
    }

    const response = createSuccessResponse('Verification token created successfully', {
      token: result.token,
      user_id: result.user_id,
    });

    logger.info(`Verification token created for user ${result.user_id}`);
    res.status(201).json(response);
  });
}
