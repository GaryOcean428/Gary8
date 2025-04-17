import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';

export class WebDataTools {
  private static instance: WebDataTools;

  private constructor() {}

  static getInstance(): WebDataTools {
    if (!WebDataTools.instance) {
      WebDataTools.instance = new WebDataTools();
    }
    return WebDataTools.instance;
  }

  async scrapeGitHubLinks(url: string): Promise<any[]> {
    thoughtLogger.log('execution', `Scraping GitHub links from ${url}`);

    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Parse HTML and extract repository links
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const links = Array.from(doc.querySelectorAll('a[href*="github.com"]'))
        .map(link => ({
          title: link.textContent?.trim() || '',
          url: link.getAttribute('href') || '',
          category: this.findCategory(link)
        }))
        .filter(link => link.url.includes('github.com') && !link.url.includes('github.com/search'));

      thoughtLogger.log('success', `Found ${links.length} repository links`);
      return links;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to scrape GitHub links', { error });
      throw new AppError('Failed to scrape GitHub links', 'SCRAPING_ERROR');
    }
  }

  private findCategory(link: Element): string {
    // Find the nearest heading element
    let element = link.parentElement;
    while (element) {
      const prevSibling = element.previousElementSibling;
      if (prevSibling?.tagName.match(/^H[1-6]$/)) {
        return prevSibling.textContent?.trim() || 'Uncategorized';
      }
      element = element.parentElement;
    }
    return 'Uncategorized';
  }

  async exportToCSV(data: any[]): Promise<string> {
    thoughtLogger.log('execution', 'Exporting data to CSV');

    try {
      if (!Array.isArray(data)) {
        throw new AppError('Data must be an array', 'VALIDATION_ERROR');
      }

      if (data.length === 0) {
        throw new AppError('Data array is empty', 'VALIDATION_ERROR');
      }

      // Get headers from first object
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => 
            this.formatCSVValue(row[header])
          ).join(',')
        )
      ].join('\n');

      thoughtLogger.log('success', 'Successfully created CSV content');
      return csvContent;
    } catch (error) {
      thoughtLogger.log('error', `Failed to create CSV: ${error}`);
      throw error instanceof AppError ? error : new AppError('Failed to create CSV', 'EXPORT_ERROR');
    }
  }

  private formatCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    // Escape quotes and wrap in quotes if necessary
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }
}