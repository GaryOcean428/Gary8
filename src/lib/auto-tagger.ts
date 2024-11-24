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

  generateTags(messages: Message[]): string[] {
    const tags = new Set<string>();
    const content = messages.map(m => m.content).join(' ').toLowerCase();

    // Topic-based tags
    this.addTopicTags(content, tags);
    
    // Technical tags
    this.addTechnicalTags(content, tags);
    
    // Length-based tags
    this.addLengthTags(messages, tags);
    
    // Interaction-based tags
    this.addInteractionTags(messages, tags);

    return Array.from(tags);
  }

  private addTopicTags(content: string, tags: Set<string>): void {
    const topics = {
      coding: ['code', 'programming', 'function', 'api', 'debug'],
      design: ['design', 'ui', 'ux', 'layout', 'style'],
      data: ['data', 'database', 'query', 'analytics'],
      business: ['business', 'strategy', 'market', 'customer']
    };

    Object.entries(topics).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        tags.add(topic);
      }
    });
  }

  private addTechnicalTags(content: string, tags: Set<string>): void {
    const technologies = {
      javascript: ['javascript', 'js', 'node', 'react'],
      python: ['python', 'django', 'flask'],
      database: ['sql', 'mongodb', 'database'],
      cloud: ['aws', 'azure', 'cloud']
    };

    Object.entries(technologies).forEach(([tech, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        tags.add(tech);
      }
    });
  }

  private addLengthTags(messages: Message[], tags: Set<string>): void {
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    
    if (totalLength < 500) tags.add('short');
    else if (totalLength > 2000) tags.add('long');
    
    if (messages.length > 10) tags.add('detailed-conversation');
  }

  private addInteractionTags(messages: Message[], tags: Set<string>): void {
    const hasCode = messages.some(m => m.content.includes('```'));
    if (hasCode) tags.add('contains-code');

    const hasLinks = messages.some(m => m.content.includes('http'));
    if (hasLinks) tags.add('contains-links');
  }
}