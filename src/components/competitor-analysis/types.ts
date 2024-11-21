export interface AnalysisParams {
  industry: string;
  region: string;
  competitors: string[];
  criteria: AnalysisCriterion[];
}

export interface AnalysisCriterion {
  id: string;
  label: string;
  weight: number;
  category: AnalysisCategory;
  subcriteria?: AnalysisCriterion[];
}

export type AnalysisCategory =
  | 'branding'
  | 'features'
  | 'ux'
  | 'technical'
  | 'marketing'
  | 'mobile'
  | 'market'
  | 'innovation';

export interface CompetitorData {
  id: string;
  name: string;
  website: string;
  scores: Record<string, number>;
  metrics: CompetitorMetrics;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface CompetitorMetrics {
  marketShare: number;
  growthRate: number;
  customerSatisfaction: number;
  brandStrength: number;
  innovationScore: number;
  technicalScore: number;
  uxScore: number;
  mobileScore: number;
}

export interface AnalysisInsight {
  category: AnalysisCategory;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  metrics?: Record<string, number>;
}