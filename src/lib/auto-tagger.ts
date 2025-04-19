import { Message } from '../types';

export class AutoTagger {
  private static instance: AutoTagger;
  
  private constructor() {}

  static getInstance(): AutoTagger {
    if (!AutoTagger.instance) {
      AutoTagger.instance = new AutoTagger();
    }
    return AutoTagger.instance;
  }

  generateTags(_messages: Message[]): string[] {
    const tags = new Set<string>();
    const content = _messages.map(_m => _m.content).join(' ').toLowerCase();

    // Topic-based tags
    this.addTopicTags(content, tags);
    
    // Technical tags
    this.addTechnicalTags(content, tags);
    
    // Length-based tags
    this.addLengthTags(_messages, tags);
    
    // Interaction-based tags
    this.addInteractionTags(_messages, tags);

    return Array.from(tags);
  }

  private addTopicTags(_content: string, _tags: Set<string>): void {
    const topics = {
      coding: ['code', 'programming', 'function', 'api', 'debug'],
      design: ['design', 'ui', 'ux', 'layout', 'style'],
      data: ['data', 'database', 'query', 'analytics'],
      business: ['business', 'strategy', 'market', 'customer']
    };

    Object.entries(topics).forEach(([topic, keywords]) => {
      if (keywords.some(_keyword => _content.includes(_keyword))) {
        _tags.add(topic);
      }
    });
  }

  private addTechnicalTags(_content: string, _tags: Set<string>): void {
    const technologies = {
      javascript: ['javascript', 'js', 'node', 'react'],
      python: ['python', 'django', 'flask'],
      database: ['sql', 'mongodb', 'database'],
      cloud: ['aws', 'azure', 'cloud']
    };

    Object.entries(technologies).forEach(([tech, keywords]) => {
      if (keywords.some(_keyword => _content.includes(_keyword))) {
        _tags.add(tech);
      }
    });
  }

  private addLengthTags(_messages: Message[], _tags: Set<string>): void {
    const totalLength = _messages.reduce((_sum, _msg) => _sum + _msg.content.length, 0);
    
    if (totalLength < 500) _tags.add('short');
    else if (totalLength > 2000) _tags.add('long');
    
    if (_messages.length > 10) _tags.add('detailed-conversation');
  }

  private addInteractionTags(_messages: Message[], _tags: Set<string>): void {
    const hasCode = _messages.some(_m => _m.content.includes('```'));
    if (hasCode) _tags.add('contains-code');

    const hasLinks = _messages.some(_m => _m.content.includes('http'));
    if (hasLinks) _tags.add('contains-links');
  }
}