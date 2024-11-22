
export interface CodeCapability {
  name: string;
  type: 'class' | 'interface' | 'function';
  path: string;
  description?: string;
}

export interface CodeReviewResult {
  issues: string[];
  suggestions: string[];
  quality: number;
}

export interface FileContent {
  path: string;
  content: string;
  matches?: string[];
}