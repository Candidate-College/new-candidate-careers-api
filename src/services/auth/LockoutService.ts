import { logger } from '@/utils/logger';
import { AUTH_CONFIG } from '@/config/auth';
import { LoginLockoutInfo } from '@/types/auth';

/**
 * LockoutService handles rate limiting and security lockout functionality
 * Replaces static in-memory lockout map with scalable solution
 */
export class LockoutService {
  private static readonly lockoutMap: Map<string, LoginLockoutInfo> = new Map();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Check if user is currently locked out
   */
  isLockedOut(email: string): boolean {
    const lockout = LockoutService.lockoutMap.get(email);
    if (!lockout) return false;

    const now = Date.now();
    return lockout.lockedUntil ? now < lockout.lockedUntil : false;
  }

  /**
   * Record a failed login attempt
   */
  recordFailedAttempt(email: string): void {
    const now = Date.now();
    const existing = LockoutService.lockoutMap.get(email);

    const failedCount = (existing?.failedCount || 0) + 1;
    const lockoutInfo: LoginLockoutInfo = {
      failedCount,
      lastFailed: now,
    };

    // Apply lockout if threshold exceeded
    if (failedCount >= AUTH_CONFIG.LOCKOUT.MAX_FAILED_ATTEMPTS) {
      lockoutInfo.lockedUntil = now + AUTH_CONFIG.LOCKOUT.LOCKOUT_DURATION_MS;
      logger.warn(`User ${email} locked out for ${AUTH_CONFIG.LOCKOUT.LOCKOUT_DURATION_MS}ms`);
    }

    LockoutService.lockoutMap.set(email, lockoutInfo);
    logger.debug(`Failed login attempt for ${email}, count: ${failedCount}`);
  }

  /**
   * Clear lockout for successful login
   */
  clearLockout(email: string): void {
    if (LockoutService.lockoutMap.has(email)) {
      LockoutService.lockoutMap.delete(email);
      logger.debug(`Lockout cleared for ${email}`);
    }
  }

  /**
   * Get lockout information for monitoring
   */
  getLockoutInfo(email: string): LoginLockoutInfo | null {
    return LockoutService.lockoutMap.get(email) || null;
  }

  /**
   * Get remaining lockout time in milliseconds
   */
  getRemainingLockoutTime(email: string): number {
    const lockout = LockoutService.lockoutMap.get(email);
    if (!lockout?.lockedUntil) return 0;

    const remaining = lockout.lockedUntil - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Start cleanup interval to prevent memory leaks
   */
  private startCleanupInterval(): void {
    if (LockoutService.cleanupInterval) {
      clearInterval(LockoutService.cleanupInterval);
    }

    LockoutService.cleanupInterval = setInterval(() => {
      this.cleanupExpiredLockouts();
    }, AUTH_CONFIG.LOCKOUT.CLEANUP_INTERVAL_MS);

    logger.info('Lockout cleanup interval started');
  }

  /**
   * Clean up expired lockouts to prevent memory leaks
   */
  private cleanupExpiredLockouts(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [email, lockout] of LockoutService.lockoutMap.entries()) {
      if (lockout.lockedUntil && now > lockout.lockedUntil) {
        LockoutService.lockoutMap.delete(email);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired lockouts`);
    }
  }

  /**
   * Get lockout statistics for monitoring
   */
  getLockoutStats(): { totalLockouts: number; activeLockouts: number } {
    const now = Date.now();
    let activeLockouts = 0;

    for (const lockout of LockoutService.lockoutMap.values()) {
      if (lockout.lockedUntil && now < lockout.lockedUntil) {
        activeLockouts++;
      }
    }

    return {
      totalLockouts: LockoutService.lockoutMap.size,
      activeLockouts,
    };
  }

  /**
   * Cleanup method for graceful shutdown
   */
  destroy(): void {
    if (LockoutService.cleanupInterval) {
      clearInterval(LockoutService.cleanupInterval);
      LockoutService.cleanupInterval = null;
    }
    LockoutService.lockoutMap.clear();
    logger.info('LockoutService destroyed');
  }
}
