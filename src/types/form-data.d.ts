declare module 'form-data' {
  class FormData {
    append(_key: string, _value: unknown, _options?: unknown): void;
    getHeaders(): any;
    // Add more methods as needed
  }
  export = FormData;
}
