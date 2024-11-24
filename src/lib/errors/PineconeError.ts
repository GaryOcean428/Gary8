export class PineconeError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly operation?: string
  ) {
    super(message);
    this.name = 'PineconeError';
  }

  static fromError(error: unknown, operation: string): PineconeError {
    if (error instanceof PineconeError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    const cause = error instanceof Error ? error.cause : error;

    return new PineconeError(message, cause, operation);
  }
} 