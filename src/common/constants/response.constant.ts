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
    message: 'Invalid credentials',
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
  INVALID_GOOGLE_TOKEN: {
    message: 'Invalid Google token',
    code: 'INVALID_GOOGLE_TOKEN'
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
  MOVIE_INVALID_SCREENING_DATES: {
    message: 'screeningEnd must be after or equal to screeningStart',
    code: 'MOVIE_INVALID_SCREENING_DATES'
  },

  //Actor
  ACTOR_NOT_FOUND: {
    message: 'Actor not found',
    code: 'ACTOR_NOT_FOUND'
  },

  // Branch
  BRANCH_NOT_FOUND: {
    message: 'Branch not found',
    code: 'BRANCH_NOT_FOUND'
  },

  // Room
  ROOM_NOT_FOUND: {
    message: 'Room not found',
    code: 'ROOM_NOT_FOUND'
  },
  ROOM_NAME_ALREADY_EXISTS_IN_BRANCH: {
    message: 'Room name already exists in this branch',
    code: 'ROOM_NAME_ALREADY_EXISTS_IN_BRANCH'
  },
  ROOM_HAS_SHOWTIMES_CANNOT_DELETE: {
    message: 'Cannot delete room because it has showtimes',
    code: 'ROOM_HAS_SHOWTIMES_CANNOT_DELETE'
  },
  USER_NO_BRANCH_ASSIGNED: {
    message: 'User does not have branch assigned',
    code: 'USER_NO_BRANCH_ASSIGNED'
  },

  // ShowTime
  SHOW_DATE_CANNOT_BE_IN_PAST: {
    message: 'Show date cannot be in the past',
    code: 'SHOW_DATE_CANNOT_BE_IN_PAST'
  },
  SHOWTIME_HAS_BOOKINGS_CANNOT_DELETE: {
    message: 'Cannot delete showtime because it has bookings',
    code: 'SHOWTIME_HAS_BOOKINGS_CANNOT_DELETE'
  },
  SHOWTIME_TIME_CONFLICT: {
    message: 'Showtime conflicts with existing showtime in the same room',
    code: 'SHOWTIME_TIME_CONFLICT'
  },

  // Seat
  SEAT_NOT_FOUND: {
    message: 'Seat not found',
    code: 'SEAT_NOT_FOUND'
  },
  SEAT_NAME_ALREADY_EXISTS_IN_ROOM: {
    message: 'Seat name already exists in room',
    code: 'SEAT_NAME_ALREADY_EXISTS_IN_ROOM'
  },
  SEAT_HAS_BOOKSEAT_CANNOT_DELETE: {
    message: 'Seat has book seat cannot delete',
    code: 'SEAT_HAS_BOOKSEAT_CANNOT_DELETE'
  },

  // Order
  FORMAT_ORDER_INCORRECT: {
    message: 'Format of order is incorrect',
    code: 'FORMAT_ORDER_INCORRECT'
  },

  // TypeSeat
  TYPE_SEAT_NOT_FOUND: {
    message: 'Type seat not found',
    code: 'TYPE_SEAT_NOT_FOUND'
  },
  TYPE_SEAT_NAME_EXISTS: {
    message: 'Type seat name already exists',
    code: 'TYPE_SEAT_NAME_EXISTS'
  },
  INVALID_PRICE: {
    message: 'Price must be a positive number',
    code: 'INVALID_PRICE'
  },

  // Review
  REVIEW_ALREADY_EXISTS: {
    message: 'You have already reviewed this movie',
    code: 'REVIEW_ALREADY_EXISTS'
  },
  REVIEW_NOT_FOUND: {
    message: 'Review not found',
    code: 'REVIEW_NOT_FOUND'
  },

  // Show Time
  SHOW_TIME_CREATE_SHOW_DATE_BEFORE_DATE_NOW: {
    message: 'Show time create show date before date now',
    code: 'SHOW_TIME_CREATE_SHOW_DATE_BEFORE_DATE_NOW'
  }
};

const createMessageESMap = (
  obj: Record<string, { message: string; code: string }>
): Map<string, string> => {
  return new Map(Object.entries(obj).map(([, { message, code }]) => [message, code]));
};

export const RESPONSE_MESSAGES_MAP = createMessageESMap(RESPONSE_MESSAGES);
