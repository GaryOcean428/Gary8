export class ResponseParser {
  static parseJSON<T>(_text: string): T {
    try {
      return JSON.parse(_text);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static extractLinks(_html: string): string[] {
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/g;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(_html)) !== null) {
      links.push(match[1]);
    }

    return links;
  }

  static sanitizeHTML(_html: string): string {
    return _html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static validateURL(_url: string): boolean {
    try {
      new URL(_url);
      return true;
    } catch {
      return false;
    }
  }
}