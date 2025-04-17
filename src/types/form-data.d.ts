declare module 'form-data' {
  class FormData {
    append(key: string, value: any, options?: any): void;
    getHeaders(): any;
    // Add more methods as needed
  }
  export = FormData;
}
