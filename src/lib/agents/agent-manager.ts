// Previous imports remain the same...

export class AgentManager {
  // Previous properties remain the same...

  async processMessage(message: Message): Promise<Message> {
    thoughtLogger.log('plan', 'Starting message processing', { messageId: message.id });

    try {
      // Route to appropriate model/agent based on message content
      const routerConfig = await this.router.route(message.content, []);
      thoughtLogger.log('decision', `Selected model: ${routerConfig.model}`, {
        confidence: routerConfig.confidence,
        strategy: routerConfig.responseStrategy
      });

      // For data gathering and analysis tasks
      if (message.content.toLowerCase().includes('find') || 
          message.content.toLowerCase().includes('search') ||
          message.content.toLowerCase().includes('gather')) {
        
        thoughtLogger.log('plan', 'Initiating multi-agent data gathering collaboration');

        // 1. Web Search Specialist gathers initial data
        const searchSpecialist = this.agents.get('specialist-search');
        if (!searchSpecialist) {
          throw new Error('Search specialist not found');
        }

        const searchResponse = await searchSpecialist.processMessage({
          ...message,
          type: 'search'
        });

        // 2. Web Data Agent processes and structures the data
        const webDataAgent = this.agents.get('task-web');
        if (!webDataAgent) {
          throw new Error('Web data agent not found');
        }

        const webDataResponse = await webDataAgent.processMessage({
          id: crypto.randomUUID(),
          role: 'system',
          content: `Process and structure the following data: ${searchResponse.content}`,
          timestamp: Date.now(),
          type: 'process'
        });

        // 3. Analysis Specialist analyzes the structured data
        const analysisSpecialist = this.agents.get('specialist-analysis');
        if (!analysisSpecialist) {
          throw new Error('Analysis specialist not found');
        }

        const analysisResponse = await analysisSpecialist.processMessage({
          id: crypto.randomUUID(),
          role: 'system',
          content: `Analyze the following structured data: ${webDataResponse.content}`,
          timestamp: Date.now(),
          type: 'analyze'
        });

        // 4. If export is requested, delegate to CSV agent
        if (message.content.toLowerCase().includes('table') || 
            message.content.toLowerCase().includes('export')) {
          
          thoughtLogger.log('plan', 'Data export requested, delegating to CSV agent');
          
          const csvAgent = this.agents.get('task-csv');
          if (!csvAgent) {
            throw new Error('CSV agent not found');
          }

          const exportResponse = await csvAgent.processMessage({
            id: crypto.randomUUID(),
            role: 'system',
            content: `Export the following data to CSV: ${analysisResponse.content}`,
            timestamp: Date.now(),
            type: 'export'
          });

          // Combine all results using MoA-style attention mechanism
          const results = [
            { agentId: 'specialist-search', content: searchResponse.content, confidence: 0.9 },
            { agentId: 'task-web', content: webDataResponse.content, confidence: 0.85 },
            { agentId: 'specialist-analysis', content: analysisResponse.content, confidence: 0.9 },
            { agentId: 'task-csv', content: exportResponse.content, confidence: 0.95 }
          ];

          const aggregatedContent = await this.memoryAggregator.aggregateResults(results);

          // Store the final result in memory
          await this.vectorMemory.store(
            aggregatedContent,
            'aggregated_result',
            {
              strategy: 'multi_agent_collaboration',
              agentCount: results.length
            }
          );

          return {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: aggregatedContent,
            timestamp: Date.now()
          };
        }

        // If no export requested, return analysis results
        return analysisResponse;
      }

      // Handle other types of requests...
      return await this.primaryAgent.processMessage(message);

    } catch (error) {
      thoughtLogger.log('error', `Message processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}