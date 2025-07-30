/**
 * Audit Controller
 *
 * Provides endpoints for viewing and managing audit logs.
 * Includes filtering, statistics, and export functionality
 * for comprehensive audit trail management.
 *
 * @module src/controllers/AuditController
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { AuditLogService } from '@/services/AuditLogService';
import { AuditValidator } from '@/validators/auditValidator';
import { formatValidationErrorResponse } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types/jwt';
import { AuditLogQueryParams, AuditLogFilterOptions, AuditLogExportOptions } from '@/types/audit';

export class AuditController {
  private readonly auditLogService: AuditLogService;

  constructor() {
    this.auditLogService = new AuditLogService();
  }

  /**
   * Convert string errors to validation error format
   */
  private convertErrorsToValidationFormat(
    errors: string[]
  ): Array<{ field: string; message: string }> {
    return errors.map(error => ({
      field: 'general',
      message: error,
    }));
  }

  /**
   * Check if user has admin privileges
   */
  private hasAdminPrivileges(user: { role?: string }): boolean {
    // TODO: Implement proper role-based authorization
    // For now, check if user has admin role or is super admin
    return user.role === 'admin' || user.role === 'super_admin';
  }

  /**
   * Get audit logs with filtering and pagination
   */
  getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    // Check if user is authenticated and has admin privileges
    if (!authReq.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    // Check if user has admin privileges
    if (!this.hasAdminPrivileges(authReq.user)) {
      res.status(403).json(createErrorResponse('Admin privileges required'));
      return;
    }

    const queryParams: AuditLogQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      sort: (req.query.sort as string) || 'created_at',
      order: (req.query.order as 'asc' | 'desc') || 'desc',
    };

    // Add filters if provided
    if (req.query.filters) {
      try {
        const filters = JSON.parse(req.query.filters as string);
        queryParams.filters = filters;
      } catch (error) {
        logger.warn('Invalid filters format in query parameters', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Validate query parameters
    const validation = AuditValidator.validateQueryParams(
      queryParams as unknown as Record<string, unknown>
    );
    if (!validation.isValid) {
      logger.warn('Audit logs query validation failed:', validation.errors);
      const validationErrors = this.convertErrorsToValidationFormat(validation.errors);
      res.status(400).json(formatValidationErrorResponse('Validation failed', validationErrors));
      return;
    }

    const sanitizedParams = AuditValidator.sanitizeQueryParamsData(
      queryParams as unknown as Record<string, unknown>
    );

    const result = await this.auditLogService.getAuditLogs(sanitizedParams);

    const response = createSuccessResponse('Audit logs retrieved successfully', {
      logs: result.logs,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.page < Math.ceil(result.total / result.limit),
        hasPrev: result.page > 1,
      },
    });

    logger.info(`Audit logs retrieved by user ${authReq.user.id}`);
    res.status(200).json(response);
  });

  /**
   * Get audit log statistics
   */
  getAuditStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    // Check if user is authenticated and has admin privileges
    if (!authReq.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    // Check if user has admin privileges
    if (!this.hasAdminPrivileges(authReq.user)) {
      res.status(403).json(createErrorResponse('Admin privileges required'));
      return;
    }

    let filters: AuditLogFilterOptions | undefined;

    // Parse filters from query parameters
    if (req.query.filters) {
      try {
        const filtersData = JSON.parse(req.query.filters as string);
        const validation = AuditValidator.validateFilterOptions(
          filtersData as unknown as Record<string, unknown>
        );
        if (validation.isValid) {
          filters = AuditValidator.sanitizeFilterOptionsData(
            filtersData as unknown as Record<string, unknown>
          );
        } else {
          logger.warn('Invalid filters format in query parameters');
        }
      } catch (error) {
        logger.warn('Failed to parse filters from query parameters', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const statistics = await this.auditLogService.getAuditLogStatistics(filters);

    const response = createSuccessResponse('Audit statistics retrieved successfully', statistics);

    logger.info(`Audit statistics retrieved by user ${authReq.user.id}`);
    res.status(200).json(response);
  });

  /**
   * Export audit logs
   */
  exportAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    // Check if user is authenticated and has admin privileges
    if (!authReq.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    // Check if user has admin privileges
    if (!this.hasAdminPrivileges(authReq.user)) {
      res.status(403).json(createErrorResponse('Admin privileges required'));
      return;
    }

    const exportOptions: AuditLogExportOptions = {
      format: (req.body.format as 'csv' | 'json' | 'xlsx') || 'json',
      include_details: req.body.include_details || false,
    };

    // Add filters if provided
    if (req.body.filters) {
      const validation = AuditValidator.validateFilterOptions(
        req.body.filters as unknown as Record<string, unknown>
      );
      if (validation.isValid) {
        exportOptions.filters = AuditValidator.sanitizeFilterOptionsData(
          req.body.filters as unknown as Record<string, unknown>
        );
      } else {
        logger.warn('Invalid filters format in request body');
        const validationErrors = this.convertErrorsToValidationFormat(validation.errors);
        res.status(400).json(formatValidationErrorResponse('Validation failed', validationErrors));
        return;
      }
    }

    // Add date range if provided
    if (req.body.start_date) {
      exportOptions.start_date = new Date(req.body.start_date);
    }

    if (req.body.end_date) {
      exportOptions.end_date = new Date(req.body.end_date);
    }

    // Validate export options
    const validation = AuditValidator.validateExportOptions(
      exportOptions as unknown as Record<string, unknown>
    );
    if (!validation.isValid) {
      logger.warn('Export options validation failed:', validation.errors);
      const validationErrors = this.convertErrorsToValidationFormat(validation.errors);
      res.status(400).json(formatValidationErrorResponse('Validation failed', validationErrors));
      return;
    }

    const sanitizedOptions = AuditValidator.sanitizeExportOptionsData(
      exportOptions as unknown as Record<string, unknown>
    );

    const exportResult = await this.auditLogService.exportAuditLogs(sanitizedOptions);

    // Set appropriate headers for file download
    res.setHeader('Content-Type', this.getContentType(sanitizedOptions.format));
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Length', exportResult.content.length);

    logger.info(
      `Audit logs exported by user ${authReq.user.id} in ${sanitizedOptions.format} format`
    );
    res.status(200).send(exportResult.content);
  });

  /**
   * Clean up old audit logs
   */
  cleanupOldLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    // Check if user is authenticated and has admin privileges
    if (!authReq.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    // Check if user has super admin privileges for cleanup operations
    if (authReq.user.role !== 'super_admin') {
      res
        .status(403)
        .json(createErrorResponse('Super admin privileges required for cleanup operations'));
      return;
    }

    const result = await this.auditLogService.cleanupOldLogs();

    if (result.error) {
      const response = createErrorResponse(`Cleanup failed: ${result.error}`);
      res.status(500).json(response);
      return;
    }

    const response = createSuccessResponse('Old audit logs cleaned up successfully', {
      deleted_count: result.deletedCount,
    });

    logger.info(
      `Audit logs cleanup performed by user ${authReq.user.id}, deleted ${result.deletedCount} records`
    );
    res.status(200).json(response);
  });

  /**
   * Get audit log by ID
   */
  getAuditLogById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    // Check if user is authenticated and has admin privileges
    if (!authReq.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    // Check if user has admin privileges
    if (!this.hasAdminPrivileges(authReq.user)) {
      res.status(403).json(createErrorResponse('Admin privileges required'));
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json(createErrorResponse('Audit log ID is required'));
      return;
    }

    const logId = parseInt(id, 10);

    if (isNaN(logId)) {
      res.status(400).json(createErrorResponse('Invalid audit log ID'));
      return;
    }

    // TODO: Implement getAuditLogById method in AuditLogService
    // For now, return a placeholder response
    const response = createErrorResponse('Audit log retrieval not implemented yet');
    res.status(501).json(response);
  });

  /**
   * Get content type for export format
   */
  private getContentType(format: string): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }
}
