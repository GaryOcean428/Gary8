import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';
import { WebDataTools } from './web-data-tools';

interface RepoLink {
  name: string;
  url: string;
  description: string;
  category: string;
}

export class GitHubScraper {
  private static instance: GitHubScraper;
  private webDataTools: WebDataTools;

  private constructor() {
    this.webDataTools = WebDataTools.getInstance();
  }

  static getInstance(): GitHubScraper {
    if (!GitHubScraper.instance) {
      GitHubScraper.instance = new GitHubScraper();
    }
    return GitHubScraper.instance;
  }

  async scrapeRepoLinks(url: string): Promise<RepoLink[]> {
    thoughtLogger.log('execution', `Scraping GitHub repo links from ${url}`);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new AppError(
          `Failed to fetch GitHub page: ${response.statusText}`,
          'API_ERROR'
        );
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const links: RepoLink[] = [];
      let currentCategory = '';

      // Find all headers and links in the README
      const content = doc.querySelector('#readme');
      if (!content) {
        throw new AppError('No README content found', 'PARSING_ERROR');
      }

      const elements = content.querySelectorAll('h1, h2, h3, li');
      
      elements.forEach(element => {
        if (element.tagName.toLowerCase().startsWith('h')) {
          currentCategory = element.textContent?.trim() || '';
        } else if (element.tagName.toLowerCase() === 'li') {
          const link = element.querySelector('a');
          if (link && link.href.includes('github.com')) {
            links.push({
              name: link.textContent?.trim() || '',
              url: link.href,
              description: element.textContent?.replace(link.textContent || '', '').trim() || '',
              category: currentCategory
            });
          }
        }
      });

      thoughtLogger.log('success', `Found ${links.length} repository links`);
      return links;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to scrape GitHub links', { error });
      throw error instanceof AppError ? error : new AppError('Failed to scrape GitHub links', 'SCRAPING_ERROR');
    }
  }

  async exportToCSV(links: RepoLink[]): Promise<string> {
    thoughtLogger.log('execution', 'Generating CSV export');

    try {
      const headers = ['Name', 'URL', 'Description', 'Category'];
      const rows = [
        headers.join(','),
        ...links.map(link => [
          this.escapeCSV(link.name),
          this.escapeCSV(link.url),
          this.escapeCSV(link.description),
          this.escapeCSV(link.category)
        ].join(','))
      ];

      const csvContent = rows.join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `github_repos_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      thoughtLogger.log('success', 'CSV export completed', {
        rowCount: links.length
      });

      return csvContent;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to export CSV', { error });
      throw new AppError('Failed to export CSV', 'EXPORT_ERROR');
    }
  }

  private escapeCSV(str: string): string {
    if (!str) return '""';
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }
}