import { Router } from 'express';
import userRoutes from './users';
import cookieRoutes from './cookies';
import corsRoutes from './cors';
import authRoutes from './auth';
import auditRoutes from './audit';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cookies', cookieRoutes);
router.use('/cors', corsRoutes);
router.use('/audit', auditRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Information
 *     tags: [Health]
 *     description: Get API information and available endpoints
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Welcome to the API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: "/auth"
 *                     users:
 *                       type: string
 *                       example: "/users"
 *                     cookies:
 *                       type: string
 *                       example: "/cookies"
 *                     cors:
 *                       type: string
 *                       example: "/cors"
 *                     audit:
 *                       type: string
 *                       example: "/audit"
 *                     health:
 *                       type: string
 *                       example: "/health"
 *                 documentation:
 *                   type: string
 *                   example: "/api-docs"
 *             example:
 *               message: "Welcome to the API"
 *               version: "1.0.0"
 *               endpoints:
 *                 auth: "/auth"
 *                 users: "/users"
 *                 cookies: "/cookies"
 *                 cors: "/cors"
 *                 audit: "/audit"
 *                 health: "/health"
 *               documentation: "/api-docs"
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users',
      cookies: '/cookies',
      cors: '/cors',
      audit: '/audit',
      health: '/health',
    },
    documentation: '/api-docs',
  });
});

export default router;
