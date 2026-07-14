export class CustomException extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundException extends CustomException {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationException extends CustomException {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}

export class ConflictException extends CustomException {
  constructor(message: string = 'Resource conflict occurred') {
    super(message, 409);
  }
}

export class UnauthorizedException extends CustomException {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenException extends CustomException {
  constructor(message: string = 'Forbidden access') {
    super(message, 403);
  }
}
