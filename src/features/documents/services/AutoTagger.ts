import { thoughtLogger } from '../../../lib/logging/thought-logger';

export class AutoTagger {
  // Common technical terms and their categories
  private readonly tagCategories = {
    programming: [
      'javascript', 'typescript', 'python', 'java', 'c++', 'code', 'function',
      'class', 'api', 'react', 'vue', 'angular', 'node', 'express', 'database'
    ],
    documentation: [
      'readme', 'docs', 'documentation', 'guide', 'tutorial', 'manual',
      'reference', 'specification', 'api doc', 'changelog'
    ],
    configuration: [
      'config', 'settings', 'env', 'environment', 'setup', 'installation',
      'docker', 'kubernetes', 'deployment', 'build'
    ],
    data: [
      'json', 'xml', 'csv', 'database', 'sql', 'nosql', 'schema',
      'model', 'dataset', 'analytics'
    ],
    security: [
      'security', 'auth', 'authentication', 'authorization', 'encryption',
      'token', 'jwt', 'oauth', 'password', 'credentials'
    ]
  };

  // File type tags
  private readonly fileTypeTags: Record<string, string[]> = {
    'application/pdf': ['pdf', 'document'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx', 'document'],
    'text/plain': ['txt', 'text'],
    'text/markdown': ['markdown', 'documentation']
  };

  async generateTags(content: string, fileName: string, mimeType: string): Promise<string[]> {
    thoughtLogger.log('execution', 'Generating tags for document', { fileName });

    try {
      const tags = new Set<string>();

      // Add file type tags
      this.addFileTypeTags(tags, mimeType);

      // Add content-based tags
      this.addContentTags(tags, content);

      // Add filename-based tags
      this.addFilenameTags(tags, fileName);

      // Convert to array and limit number of tags
      const finalTags = Array.from(tags).slice(0, 10);

      thoughtLogger.log('success', 'Tags generated successfully', {
        fileName,
        tagCount: finalTags.length,
        tags: finalTags
      });

      return finalTags;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to generate tags', { error });
      return [];
    }
  }

  private addFileTypeTags(tags: Set<string>, mimeType: string): void {
    const typeTags = this.fileTypeTags[mimeType] || [];
    typeTags.forEach(tag => tags.add(tag));
  }

  private addContentTags(tags: Set<string>, content: string): void {
    const normalizedContent = content.toLowerCase();

    // Add category-based tags
    for (const [category, terms] of Object.entries(this.tagCategories)) {
      const hasTerms = terms.some(term => normalizedContent.includes(term));
      if (hasTerms) {
        tags.add(category);
        // Add specific matching terms as tags
        terms
          .filter(term => normalizedContent.includes(term))
          .forEach(term => tags.add(term));
      }
    }

    // Add language-specific tags
    this.detectLanguages(normalizedContent).forEach(lang => tags.add(lang));
  }

  private addFilenameTags(tags: Set<string>, fileName: string): void {
    const normalizedName = fileName.toLowerCase();

    // Add tags based on common filename patterns
    if (normalizedName.includes('readme')) tags.add('documentation');
    if (normalizedName.includes('config')) tags.add('configuration');
    if (normalizedName.includes('test')) tags.add('testing');
    if (normalizedName.includes('example')) tags.add('example');
    
    // Add extension as tag
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension && extension !== fileName.toLowerCase()) {
      tags.add(extension);
    }
  }

  private detectLanguages(content: string): string[] {
    const languages: string[] = [];
    
    // Simple language detection based on common patterns
    if (content.includes('function') || content.includes('const') || content.includes('let')) {
      languages.push('javascript');
    }
    if (content.includes('interface') || content.includes('type ') || content.includes(': string')) {
      languages.push('typescript');
    }
    if (content.includes('def ') || content.includes('import ') || content.includes('class ')) {
      languages.push('python');
    }
    if (content.includes('public class') || content.includes('private void')) {
      languages.push('java');
    }

    return languages;
  }

  generateTagsFromMessages(messages: { content: string }[]): string[] {
    const tags = new Set<string>();
    const content = messages.map(m => m.content).join(' ').toLowerCase();

    // Topic-based tags
    this.addContentTags(tags, content);

    // Interaction-based tags
    const hasCode = messages.some(m => m.content.includes('```'));
    if (hasCode) tags.add('contains-code');

    const hasLinks = messages.some(m => m.content.includes('http'));
    if (hasLinks) tags.add('contains-links');
    
    // Length-based tags
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    if (totalLength < 500) tags.add('short');
    else if (totalLength > 2000) tags.add('long');
    
    if (messages.length > 10) tags.add('detailed-conversation');

    return Array.from(tags);
  }
}