export const RESPONSE_MESSAGES = {
  // Success
  SUCCESSFUL: {
    message: 'Successful',
    code: 'SUCCESS'
  },
  CREATED_SUCCESS: {
    message: 'Resource created successfully',
    code: 'CREATED_SUCCESS'
  },
  UPDATED_SUCCESS: {
    message: 'Resource updated successfully',
    code: 'UPDATED_SUCCESS'
  },
  DELETED_SUCCESS: {
    message: 'Resource deleted successfully',
    code: 'DELETED_SUCCESS'
  },

  // Common
  VALIDATION_ERROR: {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR'
  },
  INTERNAL_SERVER_ERROR: {
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR'
  },
  NOT_FOUND: {
    message: 'Resource not found',
    code: 'NOT_FOUND'
  },
  UNAUTHORIZED: {
    message: 'Unauthorized access',
    code: 'UNAUTHORIZED'
  },
  FORBIDDEN: {
    message: 'Access forbidden',
    code: 'FORBIDDEN'
  },
  CONFLICT: {
    message: 'Resource conflict',
    code: 'CONFLICT'
  },
  BAD_REQUEST: {
    message: 'Bad request',
    code: 'BAD_REQUEST'
  },

  // Validation
  PASSWORD_MISSING_REQUIREMENTS: {
    message:
      'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character',
    code: 'PASSWORD_MISSING_REQUIREMENTS'
  },
  EMAIL_ALREADY_EXISTS: {
    message: 'Email already exists',
    code: 'EMAIL_ALREADY_EXISTS'
  },

  // Auth
  INVALID_CREDENTIALS: {
    message: 'Invalid email or password',
    code: 'INVALID_CREDENTIALS'
  },

  // Account
  ACCOUNT_NOT_FOUND: {
    message: 'Account not found',
    code: 'ACCOUNT_NOT_FOUND'
  },
  ACCOUNT_DELETED: {
    message: 'Account has been deleted',
    code: 'ACCOUNT_DELETED'
  },
  UNKNOWN_ACCOUNT_STATUS: {
    message: 'Unknown account status',
    code: 'UNKNOWN_ACCOUNT_STATUS'
  },
  INVALID_CODE_LENGTH: {
    message: 'Code must be 6 characters long',
    code: 'INVALID_CODE_LENGTH'
  },
  INVALID_CODE: {
    message: 'Invalid code',
    code: 'INVALID_CODE'
  },
  INVALID_OR_EXPIRED_TOKEN: {
    message: 'Invalid or expired token',
    code: 'INVALID_OR_EXPIRED_TOKEN'
  },
  ALREADY_LOGGED_OUT: {
    message: 'You have already logged out',
    code: 'ALREADY_LOGGED_OUT'
  },
  EMAIL_NOT_VERIFIED: {
    message: 'Email not verified. Please verify your email to proceed.',
    code: 'EMAIL_NOT_VERIFIED'
  },
  PASSWORD_CONFIRM_NOT_MATCH: {
    message: 'Password confirmation does not match',
    code: 'PASSWORD_CONFIRM_NOT_MATCH'
  },

  // Role
  ROLE_NOT_FOUND: {
    message: 'Role not found',
    code: 'ROLE_NOT_FOUND'
  },

  //Movie
  MOVIE_NOT_FOUND: {
    message: 'Movie not found',
    code: 'MOVIE_NOT_FOUND'
  },
  MOVIE_NAME_EXISTS: {
    message: 'Movie name already exists',
    code: 'MOVIE_NAME_EXISTS'
  },

  //Actor
  ACTOR_NOT_FOUND: {
    message: 'Actor not found',
    code: 'ACTOR_NOT_FOUND'
  },

  // Order
  FORMAT_ORDER_INCORRECT: {
    message: 'Format of order is incorrect',
    code: 'FORMAT_ORDER_INCORRECT'
  }
};

const createMessageESMap = (
  obj: Record<string, { message: string; code: string }>
): Map<string, string> => {
  return new Map(Object.entries(obj).map(([, { message, code }]) => [message, code]));
};

export const RESPONSE_MESSAGES_MAP = createMessageESMap(RESPONSE_MESSAGES);
