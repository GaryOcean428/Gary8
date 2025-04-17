import { AgentSystem } from './agent-system';

export async function testAgentSystem() {
  try {
    const system = AgentSystem.getInstance();
    const response = await system.processMessage(
      "What are your core capabilities?",
      content => console.log('Streaming:', content),
      state => console.log('State:', state)
    );
    return response;
  } catch (error) {
    console.error('Agent system test failed:', error);
    throw error;
  }
}