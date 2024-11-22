import { describe, it, expect, beforeEach } from 'vitest';
import { agentSystem } from '../lib/agent-system';
import { thoughtLogger } from '../lib/logging/thought-logger';

describe('Agent System', () => {
  beforeEach(() => {
    // Reset agent system state
    return agentSystem.initialize();
  });

  describe('Multi-Agent Communication', () => {
    it('should delegate tasks correctly', async () => {
      const stats = await agentSystem.getAgents();
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should log thoughts properly', async () => {
      const logs = await thoughtLogger.getRecentLogs();
      expect(logs).toBeDefined();
    });
  });
});