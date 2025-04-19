import { useToast } from '../../hooks/useToast';

export class ErrorHandler {
  private static toast = useToast();

  static handle(_error: unknown): void {
    console.error('Error:', _error);

    const message = _error instanceof Error 
      ? _error.message 
      : 'An unexpected error occurred';

    this.toast.addToast({
      type: 'error',
      title: 'Error',
      message,
      duration: 5000
    });
  }

  static async handleAsync<T>(
    _promise: Promise<T>,
    _errorMessage = 'Operation failed'
  ): Promise<T | null> {
    try {
      return await _promise;
    } catch (error) {
      this.handle(error);
      return null;
    }
  }
}