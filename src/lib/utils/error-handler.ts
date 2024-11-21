import { useToast } from '../../hooks/useToast';

export class ErrorHandler {
  private static toast = useToast();

  static handle(error: unknown): void {
    console.error('Error:', error);

    const message = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';

    this.toast.addToast({
      type: 'error',
      title: 'Error',
      message,
      duration: 5000
    });
  }

  static async handleAsync<T>(
    promise: Promise<T>,
    errorMessage = 'Operation failed'
  ): Promise<T | null> {
    try {
      return await promise;
    } catch (error) {
      this.handle(error);
      return null;
    }
  }
}