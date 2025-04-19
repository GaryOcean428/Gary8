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

  async generateTags(_content: string, _fileName: string, _mimeType: string): Promise<string[]> {
    thoughtLogger.log('execution', 'Generating tags for document', { _fileName });

    try {
      const tags = new Set<string>();

      // Add file type tags
      this.addFileTypeTags(tags, _mimeType);

      // Add content-based tags
      this.addContentTags(tags, _content);

      // Add filename-based tags
      this.addFilenameTags(tags, _fileName);

      // Convert to array and limit number of tags
      const finalTags = Array.from(tags).slice(0, 10);

      thoughtLogger.log('success', 'Tags generated successfully', {
        _fileName,
        tagCount: finalTags.length,
        tags: finalTags
      });

      return finalTags;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to generate tags', { error });
      return [];
    }
  }

  private addFileTypeTags(_tags: Set<string>, _mimeType: string): void {
    const typeTags = this.fileTypeTags[_mimeType] || [];
    typeTags.forEach(_tag => _tags.add(_tag));
  }

  private addContentTags(_tags: Set<string>, _content: string): void {
    const normalizedContent = _content.toLowerCase();

    // Add category-based tags
    for (const [category, terms] of Object.entries(this.tagCategories)) {
      const hasTerms = terms.some(_term => normalizedContent.includes(_term));
      if (hasTerms) {
        _tags.add(category);
        // Add specific matching terms as tags
        terms
          .filter(_term => normalizedContent.includes(_term))
          .forEach(_term => _tags.add(_term));
      }
    }

    // Add language-specific tags
    this.detectLanguages(normalizedContent).forEach(_lang => _tags.add(_lang));
  }

  private addFilenameTags(_tags: Set<string>, _fileName: string): void {
    const normalizedName = _fileName.toLowerCase();

    // Add tags based on common filename patterns
    if (normalizedName.includes('readme')) _tags.add('documentation');
    if (normalizedName.includes('config')) _tags.add('configuration');
    if (normalizedName.includes('test')) _tags.add('testing');
    if (normalizedName.includes('example')) _tags.add('example');
    
    // Add extension as tag
    const extension = _fileName.split('.').pop()?.toLowerCase();
    if (extension && extension !== _fileName.toLowerCase()) {
      _tags.add(extension);
    }
  }

  private detectLanguages(_content: string): string[] {
    const languages: string[] = [];
    
    // Simple language detection based on common patterns
    if (_content.includes('function') || _content.includes('const') || _content.includes('let')) {
      languages.push('javascript');
    }
    if (_content.includes('interface') || _content.includes('type ') || _content.includes(': string')) {
      languages.push('typescript');
    }
    if (_content.includes('def ') || _content.includes('import ') || _content.includes('class ')) {
      languages.push('python');
    }
    if (_content.includes('public class') || _content.includes('private void')) {
      languages.push('java');
    }

    return languages;
  }

  generateTagsFromMessages(_messages: { content: string }[]): string[] {
    const tags = new Set<string>();
    const content = _messages.map(_m => _m.content).join(' ').toLowerCase();

    // Topic-based tags
    this.addContentTags(tags, content);

    // Interaction-based tags
    const hasCode = _messages.some(_m => _m.content.includes('```'));
    if (hasCode) tags.add('contains-code');

    const hasLinks = _messages.some(_m => _m.content.includes('http'));
    if (hasLinks) tags.add('contains-links');
    
    // Length-based tags
    const totalLength = _messages.reduce((_sum, _msg) => _sum + _msg.content.length, 0);
    if (totalLength < 500) tags.add('short');
    else if (totalLength > 2000) tags.add('long');
    
    if (_messages.length > 10) tags.add('detailed-conversation');

    return Array.from(tags);
  }
}