import * as env from 'dotenv';

env.config();

export const redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: parseInt(process.env.REDIS_DB || '0'),
  password: process.env.REDIS_PASSWORD
};

export const email = {
  from: process.env.EMAIL_FROM,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD
};

export const jwt = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  jwtVerificationSecret: process.env.JWT_VERIFICATION_SECRET,
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  emailVerificationTokenTtl: process.env.EMAIL_VERIFICATION_TOKEN_TTL || '1h',
  apiEmailVerifyUrl: process.env.API_EMAIL_VERIFY_URL,
  clientVerifySuccessUrl: process.env.CLIENT_VERIFY_SUCCESS_URL,
  clientVerifyFailedUrl: process.env.CLIENT_VERIFY_FAILED_URL
};

export const db = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development'
};
