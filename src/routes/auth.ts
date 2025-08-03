import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { UserController } from '@/controllers/UserController';
import { EmailVerificationController } from '@/controllers/EmailVerificationController';
import { PermissionController } from '@/controllers/PermissionController';
import { authRateLimit, generalRateLimit } from '@/middleware/rateLimitMiddleware';
import { JWTMiddleware } from '@/middleware/jwtMiddleware';

const router = Router();
const authController = new AuthController();
const userController = new UserController();
const emailVerificationController = new EmailVerificationController();
const permissionController = new PermissionController();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     description: Authenticate user with email and password, return JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "securePassword123"
 *             remember_me: true
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               message: "Login successful"
 *               data:
 *                 user:
 *                   id: 1
 *                   email: "user@example.com"
 *                   username: "johndoe"
 *                   first_name: "John"
 *                   last_name: "Doe"
 *                   is_active: true
 *                   last_login: "2024-01-01T00:00:00.000Z"
 *                 tokens:
 *                   access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', authRateLimit(), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     description: Refresh access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Refresh token
 *             required:
 *               - refresh_token
 *           example:
 *             refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                     expires_in:
 *                       type: number
 *                 timestamp:
 *                   type: string
 *             example:
 *               message: "Token refreshed successfully"
 *               data:
 *                 access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 expires_in: 900000
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', authRateLimit(), authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: Logout user and invalidate current session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *             example:
 *               message: "Logout successful"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', authRateLimit(), authController.logout);

/**
 * @swagger
 * /auth/session:
 *   get:
 *     summary: Get session status
 *     tags: [Authentication]
 *     description: Get current session information and status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         user_id:
 *                           type: string
 *                         created_at:
 *                           type: string
 *                         last_activity:
 *                           type: string
 *                         expires_at:
 *                           type: string
 *                         is_active:
 *                           type: boolean
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         username:
 *                           type: string
 *                 timestamp:
 *                   type: string
 *             example:
 *               message: "Session information retrieved"
 *               data:
 *                 session:
 *                   id: "session-uuid"
 *                   user_id: "1"
 *                   created_at: "2024-01-01T00:00:00.000Z"
 *                   last_activity: "2024-01-01T00:00:00.000Z"
 *                   expires_at: "2024-01-08T00:00:00.000Z"
 *                   is_active: true
 *                 user:
 *                   id: "1"
 *                   email: "user@example.com"
 *                   username: "johndoe"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       401:
 *         description: Unauthorized or session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/session', authRateLimit(), authController.getSessionStatus);

/**
 * @swagger
 * /auth/revoke:
 *   post:
 *     summary: Revoke all user sessions
 *     tags: [Authentication]
 *     description: Revoke all sessions for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     revoked_count:
 *                       type: number
 *                 timestamp:
 *                   type: string
 *             example:
 *               message: "All sessions revoked successfully"
 *               data:
 *                 revoked_count: 3
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/revoke', authRateLimit(), authController.revokeAllSessions);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (Super Admin only)
 *     tags: [Authentication]
 *     description: Create a new user account with email verification (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *               - role_id
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: User's full name
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password
 *               role_id:
 *                 type: integer
 *                 description: User's role ID
 *           example:
 *             email: "newuser@example.com"
 *             name: "John Doe"
 *             password: "securePassword123"
 *             role_id: 2
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     uuid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     email_verified_at:
 *                       type: string
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *             example:
 *               message: "User registered successfully. Verification email sent."
 *               data:
 *                 id: 1
 *                 uuid: "user-uuid"
 *                 email: "newuser@example.com"
 *                 name: "John Doe"
 *                 role_id: 2
 *                 status: "inactive"
 *                 email_verified_at: null
 *                 created_at: "2024-01-01T00:00:00.000Z"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Super Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/register',
  authRateLimit(),
  JWTMiddleware.authenticateToken(),
  JWTMiddleware.requireRole('super_admin'),
  userController.registerUser
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email with token
 *     tags: [Authentication]
 *     description: Verify user email using verification token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - email
 *             properties:
 *               token:
 *                 type: string
 *                 description: Email verification token
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *           example:
 *             token: "verification-token-uuid"
 *             email: "user@example.com"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                     message:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *             example:
 *               message: "Email verified successfully"
 *               data:
 *                 user_id: 1
 *                 message: "Email verification completed"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: Invalid token or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-email', generalRateLimit(), emailVerificationController.verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Authentication]
 *     description: Resend email verification token to user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *           example:
 *             email: "user@example.com"
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *             example:
 *               message: "Verification email sent successfully"
 *               data: {}
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: User not found or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/resend-verification',
  generalRateLimit(),
  emailVerificationController.resendVerificationEmail
);

// ============================================================================
// PERMISSION CHECKING ROUTES (for authenticated users)
// ============================================================================

/**
 * @swagger
 * /api/v1/auth/permissions/check:
 *   get:
 *     summary: Check if user has a specific permission
 *     tags: [Auth - Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: permission
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission string to check
 *     responses:
 *       200:
 *         description: Permission check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Permission check completed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     has_permission:
 *                       type: boolean
 *                       description: Whether user has the permission
 *                     permission:
 *                       type: string
 *                       description: The permission that was checked
 *                     user_id:
 *                       type: integer
 *                       description: User ID
 *       400:
 *         description: Permission parameter missing or invalid
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/permissions/check',
  permissionController.checkUserPermission.bind(permissionController)
);

/**
 * @swagger
 * /api/v1/auth/permissions/check-multiple:
 *   get:
 *     summary: Check if user has multiple permissions
 *     tags: [Auth - Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: permissions
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Array of permission strings to check
 *     responses:
 *       200:
 *         description: Multiple permission check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Permission check completed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     has_permission:
 *                       type: boolean
 *                       description: Whether user has all permissions
 *                     checked_permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Permissions that were checked
 *                     granted_permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Permissions that user has
 *                     user_id:
 *                       type: integer
 *                       description: User ID
 *       400:
 *         description: Permissions parameter missing or invalid
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/permissions/check-multiple',
  permissionController.checkUserPermissions.bind(permissionController)
);

/**
 * @swagger
 * /api/v1/auth/permissions/my-permissions:
 *   get:
 *     summary: Get all permissions for the authenticated user
 *     tags: [Auth - Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "User permissions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                       description: User ID
 *                     permissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Permission'
 *                       description: All permissions for the user
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/permissions/my-permissions',
  permissionController.getUserPermissions.bind(permissionController)
);

export default router;
