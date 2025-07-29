/**
 * Security Headers Middleware Tests
 *
 * This module contains comprehensive unit tests for the security headers
 * middleware, including helmet configuration, CORS settings, and
 * additional security headers.
 *
 * @module src/tests/middleware/securityHeaders.test.ts
 */

import request from 'supertest';
import express from 'express';
import {
  SecurityHeadersService,
  SecurityHeadersMiddleware,
} from '../../middleware/securityHeaders';
import { SecurityHeadersConfig } from '../../types/security';

describe('SecurityHeadersService', () => {
  describe('createHelmetConfig', () => {
    it('should create helmet configuration when enabled', () => {
      const config = { enabled: true };
      const middleware = SecurityHeadersService.createHelmetConfig(config);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create no-op middleware when disabled', () => {
      const config = { enabled: false };
      const middleware = SecurityHeadersService.createHelmetConfig(config);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create helmet with custom options', () => {
      const config = {
        enabled: true,
        options: {
          xssFilter: true,
          noSniff: true,
          frameguard: true,
        },
      };
      const middleware = SecurityHeadersService.createHelmetConfig(config);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('createCorsConfig', () => {
    it('should create CORS configuration when enabled', () => {
      const config = { enabled: true };
      const middleware = SecurityHeadersService.createCorsConfig(config);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create no-op middleware when disabled', () => {
      const config = { enabled: false };
      const middleware = SecurityHeadersService.createCorsConfig(config);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create CORS with custom options', () => {
      const config = {
        enabled: true,
        options: {
          origin: ['http://localhost:3000'],
          methods: ['GET', 'POST'],
          credentials: true,
        },
      };
      const middleware = SecurityHeadersService.createCorsConfig(config);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('createAdditionalHeaders', () => {
    it('should create additional headers middleware', () => {
      const middleware = SecurityHeadersService.createAdditionalHeaders();
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create additional headers middleware with custom headers', () => {
      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'X-Another-Header': 'another-value',
      };
      const middleware = SecurityHeadersService.createAdditionalHeaders(customHeaders);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('createSecurityHeaders', () => {
    it('should create comprehensive security headers middleware', () => {
      const config: SecurityHeadersConfig = {
        helmet: { enabled: true },
        cors: { enabled: true },
        additionalHeaders: { 'X-Custom-Security': 'enabled' },
      };
      const middleware = SecurityHeadersService.createSecurityHeaders(config);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const config: SecurityHeadersConfig = {
        helmet: { enabled: true },
        cors: { enabled: true },
      };
      const result = SecurityHeadersService.validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid helmet configuration', () => {
      const config = {
        helmet: { enabled: 'invalid' },
        cors: { enabled: true },
      } as any;
      const result = SecurityHeadersService.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('helmet.enabled must be a boolean');
    });

    it('should reject invalid CORS configuration', () => {
      const config = {
        helmet: { enabled: true },
        cors: { enabled: 'invalid' },
      } as any;
      const result = SecurityHeadersService.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('cors.enabled must be a boolean');
    });

    it('should reject invalid CORS origin', () => {
      const config = {
        helmet: { enabled: true },
        cors: {
          enabled: true,
          options: { origin: 123 },
        },
      } as any;
      const result = SecurityHeadersService.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'cors.options.origin must be a string, array, boolean, RegExp, or function'
      );
    });
  });
});

describe('SecurityHeadersMiddleware', () => {
  describe('strict', () => {
    it('should create strict security headers middleware', () => {
      const middleware = SecurityHeadersMiddleware.strict();
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('moderate', () => {
    it('should create moderate security headers middleware', () => {
      const middleware = SecurityHeadersMiddleware.moderate();
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('lenient', () => {
    it('should create lenient security headers middleware', () => {
      const middleware = SecurityHeadersMiddleware.lenient();
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('custom', () => {
    it('should create custom security headers middleware with valid config', () => {
      const config: SecurityHeadersConfig = {
        helmet: { enabled: true },
        cors: { enabled: true },
        additionalHeaders: { 'X-Custom': 'value' },
      };
      const middleware = SecurityHeadersMiddleware.custom(config);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should throw error with invalid config', () => {
      const config = {
        helmet: { enabled: 'invalid' },
        cors: { enabled: true },
      } as any;
      expect(() => SecurityHeadersMiddleware.custom(config)).toThrow();
    });
  });

  describe('createSecurityHeaders', () => {
    it('should create security headers middleware with options', () => {
      const middleware = SecurityHeadersMiddleware.createSecurityHeaders({
        headers: {
          helmet: { enabled: true },
          cors: { enabled: true },
        },
      });
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });
});

describe('Security Headers Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Strict Security Headers', () => {
    beforeEach(() => {
      app.use(SecurityHeadersMiddleware.strict());
      app.get('/test', (req, res) => {
        res.status(200).json({ message: 'Success' });
      });
    });

    it('should set security headers', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers).toHaveProperty('referrer-policy');
      expect(response.headers).toHaveProperty('x-permitted-cross-domain-policies');
      expect(response.headers).toHaveProperty('x-download-options');
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
    });

    it('should set custom security headers', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-custom-security-header');
      expect(response.headers['x-custom-security-header']).toBe('strict');
    });
  });

  describe('Moderate Security Headers', () => {
    beforeEach(() => {
      app.use(SecurityHeadersMiddleware.moderate());
      app.get('/test', (req, res) => {
        res.status(200).json({ message: 'Success' });
      });
    });

    it('should set moderate security headers', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Lenient Security Headers', () => {
    beforeEach(() => {
      app.use(SecurityHeadersMiddleware.lenient());
      app.get('/test', (req, res) => {
        res.status(200).json({ message: 'Success' });
      });
    });

    it('should set lenient security headers', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('CORS Configuration', () => {
    beforeEach(() => {
      app.use(SecurityHeadersMiddleware.moderate());
      app.get('/test', (req, res) => {
        res.status(200).json({ message: 'Success' });
      });
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect(response.status).toBe(204);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    it('should handle CORS requests', async () => {
      const response = await request(app).get('/test').set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Content Security Policy', () => {
    beforeEach(() => {
      app.use(SecurityHeadersMiddleware.strict());
      app.get('/test', (req, res) => {
        res.status(200).json({ message: 'Success' });
      });
    });

    it('should set Content Security Policy header', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('content-security-policy');
      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self' https: 'unsafe-inline'");
    });
  });

  describe('HTTP Strict Transport Security', () => {
    beforeEach(() => {
      app.use(SecurityHeadersMiddleware.strict());
      app.get('/test', (req, res) => {
        res.status(200).json({ message: 'Success' });
      });
    });

    it('should set HSTS header', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('strict-transport-security');
      const hsts = response.headers['strict-transport-security'];
      expect(hsts).toContain('max-age=15552000');
      expect(hsts).toContain('includeSubDomains');
    });
  });

  describe('Request ID Generation', () => {
    beforeEach(() => {
      app.use(SecurityHeadersMiddleware.moderate());
      app.get('/test', (req, res) => {
        res.status(200).json({ message: 'Success' });
      });
    });

    it('should generate request ID when not provided', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers['x-request-id']).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('should use provided request ID', async () => {
      const response = await request(app).get('/test').set('x-request-id', 'custom-request-id');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers['x-request-id']).toBe('custom-request-id');
    });
  });
});
