export type ActivePanel = 
  | 'chat' 
  | 'canvas' 
  | 'documents' 
  | 'settings' 
  | 'search'
  | 'agents'
  | 'monitor'
  | 'code'
  | 'competitor-analysis';

export interface SidebarProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

export interface LayoutProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
  children?: React.ReactNode;
}

export interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

export interface PineconeQueryOptions {
  vector: number[];
  topK: number;
  filter?: Record<string, any>;
  includeValues?: boolean;
  includeMetadata?: boolean;
  namespace?: string;
}

export interface PineconeResponse {
  matches: Array<{
    id: string;
    score: number;
    values?: number[];
    metadata?: Record<string, any>;
  }>;
  namespace: string;
}
