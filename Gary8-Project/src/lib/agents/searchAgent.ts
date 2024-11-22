import { Agent, AgentInput, AgentOutput } from './index';
import { SearchService } from '../services/search';

export class SearchAgent implements Agent {
    id = 'search-agent';
    name = 'Search Agent';
    description = 'Performs web searches and information retrieval';
    capabilities = ['web-search', 'information-retrieval'];
    model = 'llama-3.2-7b-preview';

    private searchService: SearchService;

    constructor() {
        this.searchService = SearchService.getInstance();
    }

    async execute(input: AgentInput): Promise<AgentOutput> {
        const searchResults = await this.searchService.search(input.prompt);
        
        return {
            response: this.formatSearchResults(searchResults),
            thoughts: ['Executed web search', 'Processed results'],
            metadata: { resultCount: searchResults.length }
        };
    }

    private formatSearchResults(results: any[]): string {
        // Format search results into readable text
        return results.map(r => `${r.title}: ${r.snippet}`).join('\n\n');
    }
} 