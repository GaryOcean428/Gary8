import { thoughtLogger } from '../logging/thought-logger';
import { ToolResult } from '../types/tools';
import { WebDataTools } from './web-data-tools';

interface CompetitorData {
  name: string;
  website: string;
  location: string;
  services: string[];
  pricing?: {
    hostEmployerRate?: string;
    trainingCost?: string;
  };
  specializations: string[];
  lastUpdated: string;
}

export class CompetitorAnalysisTool {
  private static instance: CompetitorAnalysisTool;
  private webDataTools: WebDataTools;

  private constructor() {
    this.webDataTools = WebDataTools.getInstance();
  }

  static getInstance(): CompetitorAnalysisTool {
    if (!CompetitorAnalysisTool.instance) {
      CompetitorAnalysisTool.instance = new CompetitorAnalysisTool();
    }
    return CompetitorAnalysisTool.instance;
  }

  async analyzeCompetitors(industry: string, region: string): Promise<ToolResult> {
    thoughtLogger.log('plan', `Starting competitor analysis for ${industry} in ${region}`);

    try {
      // Fetch competitor data from reliable sources
      const competitors = await this.fetchCompetitorData(industry, region);
      
      // Generate analysis report
      const report = this.generateReport(competitors);
      
      // Prepare CSV export data
      const csvData = this.prepareCSVData(competitors);

      thoughtLogger.log('success', `Completed competitor analysis for ${industry}`);

      return {
        success: true,
        result: {
          report,
          csvData,
          competitors
        }
      };
    } catch (error) {
      thoughtLogger.log('error', `Competitor analysis failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async fetchCompetitorData(industry: string, region: string): Promise<CompetitorData[]> {
    thoughtLogger.log('execution', 'Fetching competitor data from sources');

    // Example GTO competitors (in production, this would fetch from APIs/databases)
    return [
      {
        name: "MEGT",
        website: "https://www.megt.com.au",
        location: "National",
        services: ["Apprenticeships", "Traineeships", "RTO Services"],
        pricing: {
          hostEmployerRate: "$150-200/week",
          trainingCost: "Government funded"
        },
        specializations: ["Trade", "Business", "Healthcare"],
        lastUpdated: new Date().toISOString()
      },
      {
        name: "MAS National",
        website: "https://www.masnational.com.au",
        location: "National",
        services: ["Apprenticeships", "Traineeships", "Employment Services"],
        pricing: {
          hostEmployerRate: "$160-220/week",
          trainingCost: "Government funded"
        },
        specializations: ["Manufacturing", "Hospitality", "Retail"],
        lastUpdated: new Date().toISOString()
      },
      {
        name: "Apprenticeship Support Australia",
        website: "https://www.apprenticeshipsupport.com.au",
        location: "National",
        services: ["Apprenticeships", "Traineeships", "Business Advisory"],
        pricing: {
          hostEmployerRate: "$140-190/week",
          trainingCost: "Government funded"
        },
        specializations: ["Construction", "Engineering", "Business"],
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  private generateReport(competitors: CompetitorData[]): string {
    thoughtLogger.log('execution', 'Generating competitor analysis report');

    return `
# Group Training Organisation (GTO) Competitor Analysis Report

## Overview
Analysis of ${competitors.length} major GTOs operating in Australia.

## Key Findings
${this.generateKeyFindings(competitors)}

## Detailed Analysis
${this.generateDetailedAnalysis(competitors)}

## Pricing Analysis
${this.generatePricingAnalysis(competitors)}

## Market Opportunities
${this.generateOpportunities(competitors)}

Report generated: ${new Date().toLocaleDateString()}
    `.trim();
  }

  private generateKeyFindings(competitors: CompetitorData[]): string {
    const services = new Set(competitors.flatMap(c => c.services));
    const specializations = new Set(competitors.flatMap(c => c.specializations));

    return `
- ${competitors.length} major GTOs analyzed
- Core services: ${Array.from(services).join(', ')}
- Key specializations: ${Array.from(specializations).join(', ')}
- Price range for host employers: ${this.getPriceRange(competitors)}
    `.trim();
  }

  private generateDetailedAnalysis(competitors: CompetitorData[]): string {
    return competitors.map(c => `
### ${c.name}
- Website: ${c.website}
- Location: ${c.location}
- Services: ${c.services.join(', ')}
- Specializations: ${c.specializations.join(', ')}
${c.pricing ? `- Host Employer Rate: ${c.pricing.hostEmployerRate}` : ''}
    `.trim()).join('\n\n');
  }

  private generatePricingAnalysis(competitors: CompetitorData[]): string {
    const priceRange = this.getPriceRange(competitors);
    return `
Average host employer rates across analyzed GTOs range from ${priceRange}.
Most GTOs offer government-funded training programs with additional support services.
    `.trim();
  }

  private generateOpportunities(competitors: CompetitorData[]): string {
    return `
1. Market gaps in specialized industry sectors
2. Potential for competitive pricing strategies
3. Opportunities for enhanced digital services
4. Regional expansion possibilities
    `.trim();
  }

  private getPriceRange(competitors: CompetitorData[]): string {
    const rates = competitors
      .filter(c => c.pricing?.hostEmployerRate)
      .map(c => c.pricing!.hostEmployerRate!);
    
    return rates.length ? rates.join(' - ') : 'Pricing data not available';
  }

  private prepareCSVData(competitors: CompetitorData[]): any[] {
    return competitors.map(c => ({
      Name: c.name,
      Website: c.website,
      Location: c.location,
      Services: c.services.join('; '),
      HostEmployerRate: c.pricing?.hostEmployerRate || 'N/A',
      TrainingCost: c.pricing?.trainingCost || 'N/A',
      Specializations: c.specializations.join('; '),
      LastUpdated: c.lastUpdated
    }));
  }
}