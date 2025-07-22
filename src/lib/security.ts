// Comprehensive security system for Linky
import { log } from './logger';

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    AUTH: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
    API: { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
    EMAIL: { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 emails per hour
  },
  
  // Password requirements
  PASSWORD_REQUIREMENTS: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  
  // Session security
  SESSION: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    httpOnly: true,
    sameSite: 'strict' as const,
  },
  
  // CORS settings
  CORS: {
    origin: ['https://linky-waitlist.vercel.app', 'https://linky.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
};

// XSS Prevention
export class XSSProtection {
  private static dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /vbscript:/gi,
    /data:/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  ];

  static sanitize(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;
    
    // Remove dangerous patterns
    this.dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // HTML entity encoding for special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }

  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitize(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  static validateInput(input: string, allowedTags: string[] = []): boolean {
    const dangerousFound = this.dangerousPatterns.some(pattern => pattern.test(input));
    
    if (dangerousFound) {
      log.warn('XSS attempt detected', { input: input.substring(0, 100) });
      return false;
    }
    
    return true;
  }
}

// CSRF Protection
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();

  static generateToken(userId: string): string {
    const token = this.generateRandomToken();
    const expires = Date.now() + (30 * 60 * 1000); // 30 minutes
    
    this.tokens.set(userId, { token, expires });
    
    log.info('CSRF token generated', { userId });
    return token;
  }

  static validateToken(userId: string, token: string): boolean {
    const stored = this.tokens.get(userId);
    
    if (!stored) {
      log.warn('CSRF token not found', { userId });
      return false;
    }
    
    if (Date.now() > stored.expires) {
      this.tokens.delete(userId);
      log.warn('CSRF token expired', { userId });
      return false;
    }
    
    if (stored.token !== token) {
      log.warn('CSRF token mismatch', { userId });
      return false;
    }
    
    return true;
  }

  static invalidateToken(userId: string): void {
    this.tokens.delete(userId);
    log.info('CSRF token invalidated', { userId });
  }

  private static generateRandomToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [userId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(userId);
      }
    }
  }
}

// Rate Limiting
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();

  static checkLimit(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    
    const current = this.requests.get(key);
    
    if (!current || now > current.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (current.count >= limit) {
      log.warn('Rate limit exceeded', { identifier, limit, windowMs });
      return false;
    }
    
    current.count++;
    return true;
  }

  static getRemainingRequests(identifier: string, limit: number, windowMs: number): number {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    
    const current = this.requests.get(key);
    
    if (!current || now > current.resetTime) {
      return limit;
    }
    
    return Math.max(0, limit - current.count);
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Input Validation and Sanitization
export class InputSanitizer {
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static sanitizePhone(phone: string): string {
    return phone.replace(/[^\d\s\-\(\)\+]/g, '').trim();
  }

  static sanitizeName(name: string): string {
    return name
      .replace(/[^a-zA-Z\s\-']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      return parsed.toString();
    } catch {
      return '';
    }
  }

  static sanitizeHtml(html: string, allowedTags: string[] = []): string {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    let sanitized = html;
    
    // Remove all script tags and event handlers
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/javascript:/gi, '');
    
    // If no allowed tags, strip all HTML
    if (allowedTags.length === 0) {
      return sanitized.replace(/<[^>]*>/g, '');
    }
    
    // Allow specific tags
    const allowedTagsRegex = new RegExp(`<(?!/?(${allowedTags.join('|')})\\b)[^>]*>`, 'gi');
    sanitized = sanitized.replace(allowedTagsRegex, '');
    
    return sanitized;
  }
}

// Security Headers
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.stripe.com https://jydldvvsxwosyzwttmui.supabase.co",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Password Security
export class PasswordSecurity {
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = SECURITY_CONFIG.PASSWORD_REQUIREMENTS;

    if (password.length < config.minLength) {
      errors.push(`Password must be at least ${config.minLength} characters long`);
    }

    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return { isValid: errors.length === 0, errors };
  }

  static hashPassword(password: string): Promise<string> {
    // In a real implementation, use bcrypt or similar
    // For now, we'll return a placeholder
    return Promise.resolve('hashed_password_placeholder');
  }

  static verifyPassword(password: string, hash: string): Promise<boolean> {
    // In a real implementation, use bcrypt.compare
    // For now, we'll return a placeholder
    return Promise.resolve(true);
  }
}

// Session Security
export class SessionSecurity {
  static generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static validateSession(sessionId: string): boolean {
    // Basic session ID validation
    return /^[a-f0-9]{64}$/.test(sessionId);
  }

  static isSessionExpired(createdAt: number, maxAge: number = SECURITY_CONFIG.SESSION.maxAge): boolean {
    return Date.now() - createdAt > maxAge;
  }
}

// Security Utilities
export class SecurityUtils {
  static generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static validateApiKey(apiKey: string): boolean {
    // Basic API key validation
    return apiKey && apiKey.length >= 32 && /^[a-zA-Z0-9_-]+$/.test(apiKey);
  }

  static sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (value) {
        sanitized[key] = XSSProtection.sanitize(value);
      }
    }
    
    return sanitized;
  }

  static logSecurityEvent(event: string, details: any): void {
    log.warn(`Security event: ${event}`, details);
  }
}

// Export security middleware
export const securityMiddleware = {
  xssProtection: XSSProtection,
  csrfProtection: CSRFProtection,
  rateLimiter: RateLimiter,
  inputSanitizer: InputSanitizer,
  passwordSecurity: PasswordSecurity,
  sessionSecurity: SessionSecurity,
  securityUtils: SecurityUtils
}; 