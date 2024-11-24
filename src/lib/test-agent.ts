import { agentSystem } from './agent-system';

export async function testAgentSystem() {
  try {
    const response = await agentSystem.processMessage(
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