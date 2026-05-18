const { z } = require('zod');

// Login with email and password schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Firebase login schema
const firebaseLoginSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required')
});

// Refresh token schema
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Register schema (for future use)
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  organizationId: z.string().optional()
});

module.exports = {
  loginSchema,
  firebaseLoginSchema,
  refreshTokenSchema,
  registerSchema
};
