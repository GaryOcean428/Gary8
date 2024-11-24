import { z } from "zod";
import { thoughtLogger } from "../../logging/thought-logger";
import { LocalToolsRegistry } from "../local-tools-registry";

export const codeSearchSchema = z.object({
    query: z.string().describe("The search query for finding code"),
    language: z.string().optional().describe("Programming language to filter by"),
    maxResults: z.number().optional().describe("Maximum number of results to return")
});

export async function searchCode(
    query: string,
    language?: string,
    maxResults: number = 10
): Promise<string> {
    try {
        thoughtLogger.log('info', 'Searching code', { query, language, maxResults });
        
        // Implement your code search logic here
        // This could integrate with GitHub, local codebase, etc.
        
        return JSON.stringify({
            results: [],
            metadata: {
                query,
                language,
                maxResults
            }
        });
    } catch (error) {
        thoughtLogger.log('error', 'Code search failed', { error });
        throw error;
    }
}

export function registerCodeSearchTool(registry: LocalToolsRegistry) {
    return registry.registerLocalTool(
        "search_code",
        "Search through codebase for specific patterns or functionality",
        codeSearchSchema,
        searchCode
    );
} 