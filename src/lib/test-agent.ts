import { AgentSystem } from './agent-system';

export async function testAgentSystem() {
  try {
    const system = AgentSystem.getInstance();
    const response = await system.processMessage(
      "What are your core capabilities?",
      _content => console.log('Streaming:', _content),
      _state => console.log('State:', _state)
    );
    return response;
  } catch (error) {
    console.error('Agent system test failed:', error);
    throw error;
  }
}