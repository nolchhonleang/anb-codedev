/**
 * Security Configuration
 * 
 * This file contains security-related configurations and middleware
 * to protect the application from common web vulnerabilities.
 */

import { HelmetOptions } from 'react-helmet-async';

export const helmetConfig: HelmetOptions = {
  // Security headers
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'" // Only in development
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https: http:"],
      connectSrc: ["'self'", process.env.REACT_APP_API_URL || ''],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Other security headers
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  xssFilter: true,
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};

// CORS configuration
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://your-production-domain.com',
        'https://www.your-production-domain.com',
      ]
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Password policy
export const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  // Consider using zxcvbn for password strength validation
  minStrength: 3, // 0-4 scale (0 = weak, 4 = very strong)
};

// Session security
export const sessionConfig = {
  name: '__Secure-sessionId',
  secret: process.env.SESSION_SECRET || 'your-secret-key', // In production, use environment variable
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
  },
  resave: false,
  saveUninitialized: false,
};

// Security middleware configurations
export const securityMiddleware = {
  noCache: {
    noStore: true,
    noCache: true,
    mustRevalidate: true,
    proxyRevalidate: true,
  },
  // Add more middleware configurations as needed
};

// Input sanitization options
export const sanitizeOptions = {
  allowedTags: [],
  allowedAttributes: {},
  // Add more sanitization options as needed
};
