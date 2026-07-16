/**
 * Standard HTTP Status Codes used across the application.
 */
export enum HttpStatus {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * Base class for all custom HTTP domain exceptions.
 */
export class CustomException extends Error {
  /**
   * Creates an instance of CustomException.
   * @param message Clear description of the error
   * @param statusCode The corresponding HTTP status code
   */
  constructor(
    public readonly message: string,
    public readonly statusCode: number = HttpStatus.BAD_REQUEST
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Exception thrown when a requested resource is missing.
 */
export class NotFoundException extends CustomException {
  constructor(message: string = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

/**
 * Exception thrown when request parameters fail validation.
 */
export class ValidationException extends CustomException {
  constructor(message: string = 'Validation failed') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when client sends a malformed request.
 */
export class BadRequestException extends CustomException {
  constructor(message: string = 'Bad request') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when concurrent operations create a conflict.
 */
export class ConflictException extends CustomException {
  constructor(message: string = 'Resource conflict occurred') {
    super(message, HttpStatus.CONFLICT);
  }
}

/**
 * Exception thrown when request lacks valid authentication credentials.
 */
export class UnauthorizedException extends CustomException {
  constructor(message: string = 'Unauthorized access') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Exception thrown when authenticated user lacks permissions for an operation.
 */
export class ForbiddenException extends CustomException {
  constructor(message: string = 'Forbidden access') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

/**
 * Exception thrown when an unexpected server error occurs.
 */
export class InternalServerException extends CustomException {
  constructor(message: string = 'Internal server error') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
