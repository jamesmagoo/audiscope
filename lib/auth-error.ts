/**
 * Custom error class for authentication-related failures
 * Used to identify and handle auth errors consistently across the application
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AuthenticationError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }

  /**
   * Check if an error is an authentication error
   */
  static isAuthError(error: unknown): error is AuthenticationError {
    return error instanceof AuthenticationError;
  }
}
