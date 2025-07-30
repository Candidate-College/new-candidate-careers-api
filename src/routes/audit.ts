/**
 * Audit Routes
 *
 * Routes for audit log management and viewing.
 * Provides endpoints for retrieving, filtering, and exporting audit logs.
 *
 * @module src/routes/audit
 */

import { Router } from 'express';
import { AuditController } from '@/controllers/AuditController';
import { authenticateToken } from '@/middleware/jwtMiddleware';

const router = Router();
const auditController = new AuditController();

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Audit log ID
 *         user_id:
 *           type: integer
 *           nullable: true
 *           description: User ID associated with the action
 *         action:
 *           type: string
 *           description: Action performed
 *         resource_type:
 *           type: string
 *           description: Type of resource affected
 *         resource_id:
 *           type: integer
 *           nullable: true
 *           description: ID of the resource affected
 *         details:
 *           type: object
 *           description: Additional details about the action
 *         ip_address:
 *           type: string
 *           nullable: true
 *           description: IP address of the user
 *         user_agent:
 *           type: string
 *           nullable: true
 *           description: User agent string
 *         session_id:
 *           type: string
 *           nullable: true
 *           description: Session ID
 *         success:
 *           type: boolean
 *           description: Whether the action was successful
 *         error_message:
 *           type: string
 *           nullable: true
 *           description: Error message if action failed
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the log was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the log was last updated
 */

/**
 * @swagger
 * /audit/logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 *     description: Retrieve audit logs with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 1000
 *         description: Number of logs per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, action, resource_type, user_id, success, ip_address]
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *         description: JSON string of filter options
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
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
 *                   example: "Audit logs retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuditLog'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Validation failed
 */
router.get('/logs', authenticateToken(), auditController.getAuditLogs);

/**
 * @swagger
 * /audit/statistics:
 *   get:
 *     summary: Get audit statistics
 *     tags: [Audit]
 *     description: Retrieve audit log statistics and analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *         description: JSON string of filter options
 *     responses:
 *       200:
 *         description: Audit statistics retrieved successfully
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
 *                   example: "Audit statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_logs:
 *                       type: integer
 *                     successful_actions:
 *                       type: integer
 *                     failed_actions:
 *                       type: integer
 *                     unique_users:
 *                       type: integer
 *                     actions_by_type:
 *                       type: object
 *                     recent_activity:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Validation failed
 */
router.get('/statistics', authenticateToken(), auditController.getAuditStatistics);

/**
 * @swagger
 * /audit/export:
 *   post:
 *     summary: Export audit logs
 *     tags: [Audit]
 *     description: Export audit logs in various formats
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [csv, json, xlsx]
 *                 default: json
 *                 description: Export format
 *               include_details:
 *                 type: boolean
 *                 default: false
 *                 description: Include detailed information
 *               filters:
 *                 type: object
 *                 description: Filter options
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Start date for export range
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: End date for export range
 *     responses:
 *       200:
 *         description: Audit logs exported successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Validation failed
 */
router.post('/export', authenticateToken(), auditController.exportAuditLogs);

/**
 * @swagger
 * /audit/cleanup:
 *   post:
 *     summary: Clean up old audit logs
 *     tags: [Audit]
 *     description: Remove old audit logs based on retention policy
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Old audit logs cleaned up successfully
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
 *                   example: "Old audit logs cleaned up successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted_count:
 *                       type: integer
 *                       description: Number of logs deleted
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Cleanup failed
 */
router.post('/cleanup', authenticateToken(), auditController.cleanupOldLogs);

/**
 * @swagger
 * /audit/logs/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit]
 *     description: Retrieve a specific audit log by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
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
 *                   example: "Audit log retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Invalid audit log ID
 *       404:
 *         description: Audit log not found
 *       501:
 *         description: Not implemented
 */
router.get('/logs/:id', authenticateToken(), auditController.getAuditLogById);

export default router;
