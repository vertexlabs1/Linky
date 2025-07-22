// Comprehensive validation system for Linky
import { log } from './logger';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' });
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' });
  }

  if (email.length > 254) {
    errors.push({ field: 'email', message: 'Email too long', code: 'TOO_LONG' });
  }

  return { isValid: errors.length === 0, errors };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required', code: 'REQUIRED' });
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters', code: 'TOO_SHORT' });
  }

  if (password.length > 128) {
    errors.push({ field: 'password', message: 'Password too long', code: 'TOO_LONG' });
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter', code: 'MISSING_LOWERCASE' });
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter', code: 'MISSING_UPPERCASE' });
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one number', code: 'MISSING_NUMBER' });
  }

  if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one special character', code: 'MISSING_SPECIAL' });
  }

  return { isValid: errors.length === 0, errors };
}

// Name validation
export function validateName(name: string, field: string = 'name'): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!name) {
    errors.push({ field, message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`, code: 'REQUIRED' });
    return { isValid: false, errors };
  }

  if (name.length < 2) {
    errors.push({ field, message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least 2 characters`, code: 'TOO_SHORT' });
  }

  if (name.length > 50) {
    errors.push({ field, message: `${field.charAt(0).toUpperCase() + field.slice(1)} too long`, code: 'TOO_LONG' });
  }

  if (!/^[a-zA-Z\s\-']+$/.test(name)) {
    errors.push({ field, message: `${field.charAt(0).toUpperCase() + field.slice(1)} contains invalid characters`, code: 'INVALID_CHARACTERS' });
  }

  return { isValid: errors.length === 0, errors };
}

// Phone validation
export function validatePhone(phone: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!phone) {
    return { isValid: true, errors: [] }; // Phone is optional
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 10) {
    errors.push({ field: 'phone', message: 'Phone number must have at least 10 digits', code: 'TOO_SHORT' });
  }

  if (digitsOnly.length > 15) {
    errors.push({ field: 'phone', message: 'Phone number too long', code: 'TOO_LONG' });
  }

  return { isValid: errors.length === 0, errors };
}

// User registration validation
export function validateUserRegistration(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required fields
  const emailValidation = validateEmail(data.email);
  const passwordValidation = validatePassword(data.password);
  const firstNameValidation = validateName(data.firstName, 'firstName');
  const lastNameValidation = validateName(data.lastName, 'lastName');

  errors.push(...emailValidation.errors);
  errors.push(...passwordValidation.errors);
  errors.push(...firstNameValidation.errors);
  errors.push(...lastNameValidation.errors);

  // Validate optional fields
  if (data.phone) {
    const phoneValidation = validatePhone(data.phone);
    errors.push(...phoneValidation.errors);
  }

  if (data.jobTitle && data.jobTitle.length > 100) {
    errors.push({ field: 'jobTitle', message: 'Job title too long', code: 'TOO_LONG' });
  }

  if (data.company && data.company.length > 100) {
    errors.push({ field: 'company', message: 'Company name too long', code: 'TOO_LONG' });
  }

  return { isValid: errors.length === 0, errors };
}

// User profile update validation
export function validateUserProfileUpdate(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  billingEmail?: string;
  billingName?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (data.firstName) {
    const firstNameValidation = validateName(data.firstName, 'firstName');
    errors.push(...firstNameValidation.errors);
  }

  if (data.lastName) {
    const lastNameValidation = validateName(data.lastName, 'lastName');
    errors.push(...lastNameValidation.errors);
  }

  if (data.phone) {
    const phoneValidation = validatePhone(data.phone);
    errors.push(...phoneValidation.errors);
  }

  if (data.jobTitle && data.jobTitle.length > 100) {
    errors.push({ field: 'jobTitle', message: 'Job title too long', code: 'TOO_LONG' });
  }

  if (data.company && data.company.length > 100) {
    errors.push({ field: 'company', message: 'Company name too long', code: 'TOO_LONG' });
  }

  if (data.billingEmail) {
    const emailValidation = validateEmail(data.billingEmail);
    errors.push(...emailValidation.errors);
  }

  if (data.billingName && data.billingName.length > 100) {
    errors.push({ field: 'billingName', message: 'Billing name too long', code: 'TOO_LONG' });
  }

  return { isValid: errors.length === 0, errors };
}

// Stripe customer ID validation
export function validateStripeCustomerId(customerId: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!customerId) {
    errors.push({ field: 'stripeCustomerId', message: 'Stripe customer ID is required', code: 'REQUIRED' });
    return { isValid: false, errors };
  }

  if (!customerId.startsWith('cus_')) {
    errors.push({ field: 'stripeCustomerId', message: 'Invalid Stripe customer ID format', code: 'INVALID_FORMAT' });
  }

  if (customerId.length < 10 || customerId.length > 50) {
    errors.push({ field: 'stripeCustomerId', message: 'Invalid Stripe customer ID length', code: 'INVALID_LENGTH' });
  }

  return { isValid: errors.length === 0, errors };
}

// Subscription plan validation
export function validateSubscriptionPlan(planId: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  const validPlans = ['prospector', 'networker', 'rainmaker', 'founding_member'];
  
  if (!planId) {
    errors.push({ field: 'planId', message: 'Subscription plan is required', code: 'REQUIRED' });
    return { isValid: false, errors };
  }

  if (!validPlans.includes(planId)) {
    errors.push({ field: 'planId', message: 'Invalid subscription plan', code: 'INVALID_PLAN' });
  }

  return { isValid: errors.length === 0, errors };
}

// API request validation
export function validateApiRequest(data: any, requiredFields: string[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push({ field, message: `${field} is required`, code: 'REQUIRED' });
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Rate limiting validation
export function validateRateLimit(userId: string, action: string, limit: number, windowMs: number): ValidationResult {
  // This would integrate with a rate limiting service
  // For now, we'll log the validation attempt
  log.info('Rate limit validation', { userId, action, limit, windowMs });
  
  return { isValid: true, errors: [] };
}

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Data integrity validation
export function validateDataIntegrity(data: any, schema: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    if (rules.required && !value) {
      errors.push({ field, message: `${field} is required`, code: 'REQUIRED' });
      continue;
    }
    
    if (value && rules.type && typeof value !== rules.type) {
      errors.push({ field, message: `${field} must be of type ${rules.type}`, code: 'INVALID_TYPE' });
    }
    
    if (value && rules.minLength && value.length < rules.minLength) {
      errors.push({ field, message: `${field} must be at least ${rules.minLength} characters`, code: 'TOO_SHORT' });
    }
    
    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors.push({ field, message: `${field} must be no more than ${rules.maxLength} characters`, code: 'TOO_LONG' });
    }
    
    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors.push({ field, message: `${field} format is invalid`, code: 'INVALID_FORMAT' });
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

// Validation error formatter
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => `${error.field}: ${error.message}`).join(', ');
}

// Comprehensive validation wrapper
export function validateAll(data: any, validations: Record<string, (value: any) => ValidationResult>): ValidationResult {
  const allErrors: ValidationError[] = [];
  
  for (const [field, validator] of Object.entries(validations)) {
    const result = validator(data[field]);
    allErrors.push(...result.errors);
  }
  
  return { isValid: allErrors.length === 0, errors: allErrors };
}

// Export validation schemas
export const VALIDATION_SCHEMAS = {
  userRegistration: {
    email: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, type: 'string', minLength: 8 },
    firstName: { required: true, type: 'string', minLength: 2, maxLength: 50 },
    lastName: { required: true, type: 'string', minLength: 2, maxLength: 50 }
  },
  userProfile: {
    firstName: { type: 'string', minLength: 2, maxLength: 50 },
    lastName: { type: 'string', minLength: 2, maxLength: 50 },
    phone: { type: 'string', pattern: /^[\d\s\-\(\)\+]+$/ },
    jobTitle: { type: 'string', maxLength: 100 },
    company: { type: 'string', maxLength: 100 }
  }
}; 