import { HybridVectorStore } from '../vectors/hybrid-store';
import { thoughtLogger } from '../utils/logger';

export const handleChatCommand = async (
  command: string,
  vectorStore: HybridVectorStore,
  contextId: string,
  content?: string
) => {
  const cmd = command.toLowerCase().trim();

  try {
    switch (cmd) {
      case '/save':
      case '/remember':
        await vectorStore.makePermanent(contextId);
        return 'Context saved to permanent memory.';
      
      case '/search':
        if (!content) return 'Please provide a search query.';
        const results = await vectorStore.search(content, { 
          limit: 5,
          includeLocal: true,
          includePermanent: true 
        });
        return formatSearchResults(results);
      
      case '/context':
        const localDocs = await vectorStore.getLocalDocuments();
        return formatContextList(localDocs);
      
      case '/clear':
        vectorStore.clearLocal();
        return 'Local context cleared.';
      
      case '/help':
        return `Available commands:
          /save - Save current context to permanent memory
          /search <query> - Search all documents
          /context - List current context documents
          /clear - Clear local context
          /help - Show this help message`;
      
      default:
        return 'Unknown command. Type /help for available commands.';
    }
  } catch (error) {
    thoughtLogger.log('error', 'Command execution failed', { command, error });
    return 'Failed to execute command.';
  }
};

const formatSearchResults = (results: any[]) => {
  return results.map((r, i) => 
    `${i + 1}. ${r.metadata.filename || 'Document'} (Score: ${r.score.toFixed(2)})
     ${r.content.substring(0, 150)}...`
  ).join('\n\n');
};

const formatContextList = (docs: any[]) => {
  return docs.length ? 
    docs.map((d, i) => `${i + 1}. ${d.metadata.filename || 'Document'} (${d.metadata.permanent ? 'Permanent' : 'Local'})`).join('\n') :
    'No documents in current context.';
}; 