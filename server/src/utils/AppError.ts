/**
 * An error with a known HTTP status code attached.
 * Services throw this for expected failure cases (not found, conflict, etc.)
 * so the global error handler can respond with the right status instead of
 * defaulting every thrown error to 500.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }

  static notFound(message: string): AppError {
    return new AppError(message, 404);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static unauthorized(message: string): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message: string): AppError {
    return new AppError(message, 403);
  }
}
