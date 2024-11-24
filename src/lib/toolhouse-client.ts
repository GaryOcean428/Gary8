import { Toolhouse } from "@toolhouseai/sdk";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Toolhouse client
export const toolhouse = new Toolhouse({
  apiKey: process.env.NEXT_PUBLIC_TOOLHOUSE_API_KEY!,
  provider: "anthropic",
  metadata: {
    "id": "gary8-assistant"
  }
});

// Initialize Anthropic client
export const anthropicClient = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
});

// Helper function for LLM calls
export async function llmCall(messages: Anthropic.Messages.MessageParam[]) {
  return await anthropicClient.messages.create({
    model: "claude-3-5-sonnet-latest",
    max_tokens: 1024,
    messages,
    system: "Respond directly, do not preface or end your responses with anything.",
    tools: await toolhouse.getTools()
  });
} 