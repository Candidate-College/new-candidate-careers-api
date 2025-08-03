/**
 * Admin Routes
 *
 * Defines all admin-specific API routes for role and permission management.
 * Includes proper middleware for Super Admin authorization, rate limiting,
 * and comprehensive Swagger documentation for the CC Career platform.
 *
 * @module src/routes/admin
 */

import { Router } from 'express';
import { JWTMiddleware } from '@/middleware/jwtMiddleware';
import { requireSuperAdmin } from '@/middleware/roleMiddleware';
import { RateLimitMiddleware } from '@/middleware/rateLimitMiddleware';
import { securityHeaders } from '@/middleware/securityHeaders';
import { InputSanitizerMiddleware } from '@/middleware/inputSanitizer';
import { AuditLoggingMiddleware } from '@/middleware/auditLoggingMiddleware';
import { RoleController } from '@/controllers/RoleController';
import { PermissionController } from '@/controllers/PermissionController';

const router = Router();
const roleController = new RoleController();
const permissionController = new PermissionController();

// Singleton instance of AuditLoggingMiddleware to avoid repeated instantiation
const auditLoggingMiddleware = new AuditLoggingMiddleware();

// Apply security and rate limiting middleware to all admin routes
router.use(securityHeaders());
router.use(
  RateLimitMiddleware.createRateLimit({
    strategy: 'moderate',
    customConfig: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    },
  })
);

// Apply authentication and authorization middleware
router.use(JWTMiddleware.authenticateToken());
router.use(requireSuperAdmin);

// Apply input sanitization and audit logging
router.use(InputSanitizerMiddleware.strict());
router.use(auditLoggingMiddleware.logAuthAttempts);

// ============================================================================
// ROLE MANAGEMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /api/v1/admin/roles:
 *   get:
 *     summary: Get all roles with pagination
 *     tags: [Admin - Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by role status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search roles by name or display name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, display_name, created_at, updated_at]
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
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
 *                   example: "Roles retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     roles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RoleWithPermissions'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/roles', roleController.getAllRoles.bind(roleController));

/**
 * @swagger
 * /api/v1/admin/roles/{id}:
 *   get:
 *     summary: Get a single role by ID
 *     tags: [Admin - Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role retrieved successfully
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
 *                   example: "Role retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/RoleWithPermissions'
 *       400:
 *         description: Invalid role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin access required
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.get('/roles/:id', roleController.getRoleById.bind(roleController));

/**
 * @swagger
 * /api/v1/admin/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Admin - Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *           example:
 *             name: "hr_manager"
 *             display_name: "HR Manager"
 *             description: "Manages HR-related operations"
 *             permissions: ["users.create", "users.read", "users.update"]
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Role created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/RoleWithPermissions'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin access required
 *       409:
 *         description: Role with this name already exists
 *       500:
 *         description: Internal server error
 */
router.post('/roles', roleController.createRole.bind(roleController));

/**
 * @swagger
 * /api/v1/admin/roles/{id}:
 *   put:
 *     summary: Update an existing role
 *     tags: [Admin - Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleRequest'
 *           example:
 *             display_name: "Senior HR Manager"
 *             description: "Manages senior HR operations"
 *             permissions: ["users.create", "users.read", "users.update", "users.delete"]
 *     responses:
 *       200:
 *         description: Role updated successfully
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
 *                   example: "Role updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/RoleWithPermissions'
 *       400:
 *         description: Validation failed or invalid role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin access required
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.put('/roles/:id', roleController.updateRole.bind(roleController));

/**
 * @swagger
 * /api/v1/admin/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Admin - Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
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
 *                   example: "Role deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     role_id:
 *                       type: integer
 *       400:
 *         description: Invalid role ID or role cannot be deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin access required
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.delete('/roles/:id', roleController.deleteRole.bind(roleController));

/**
 * @swagger
 * /api/v1/admin/roles/{id}/permissions:
 *   post:
 *     summary: Assign permissions to a role
 *     tags: [Admin - Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignPermissionsRequest'
 *           example:
 *             permissions: ["users.create", "users.read"]
 *             action: "add"
 *     responses:
 *       200:
 *         description: Permissions assigned successfully
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
 *                   example: "Permissions assigned successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     role_id:
 *                       type: integer
 *                     permissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Permission'
 *                     action:
 *                       type: string
 *       400:
 *         description: Validation failed or invalid role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin access required
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.post('/roles/:id/permissions', roleController.assignPermissions.bind(roleController));

// ============================================================================
// PERMISSION MANAGEMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /api/v1/admin/permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [Admin - Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search permissions by name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, created_at, updated_at]
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
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
 *                   example: "Permissions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     permissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Permission'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/permissions', permissionController.getAllPermissions.bind(permissionController));

/**
 * @swagger
 * /api/v1/admin/roles/{roleId}/permissions:
 *   get:
 *     summary: Get permissions for a specific role
 *     tags: [Admin - Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role permissions retrieved successfully
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
 *                   example: "Role permissions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     role_id:
 *                       type: integer
 *                     permissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Permission'
 *       400:
 *         description: Invalid role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  '/roles/:roleId/permissions',
  permissionController.getRolePermissions.bind(permissionController)
);

/**
 * @swagger
 * /api/v1/admin/permissions/bulk-assign:
 *   post:
 *     summary: Bulk assign permissions to multiple roles
 *     tags: [Admin - Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkAssignPermissionsRequest'
 *           example:
 *             role_permissions:
 *               - role_id: 1
 *                 permissions: ["users.create", "users.read"]
 *                 action: "add"
 *               - role_id: 2
 *                 permissions: ["roles.view", "roles.create"]
 *                 action: "replace"
 *     responses:
 *       200:
 *         description: Permissions bulk assigned successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin access required
 *       500:
 *         description: Internal server error
 */
router.post(
  '/permissions/bulk-assign',
  permissionController.bulkAssignPermissions.bind(permissionController)
);

export default router;
