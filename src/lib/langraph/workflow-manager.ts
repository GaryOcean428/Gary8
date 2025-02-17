import { StateGraph, END } from "langgraph-ts";
import { ChatMessage } from "@langchain/core/messages";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { thoughtLogger } from "../logging/thought-logger";
import { LangChainConfig } from "../config/langchain-config";
import { ToolhouseConfig } from "../config/toolhouse-config";

interface WorkflowState {
    messages: ChatMessage[];
    context?: any;
    currentStep?: string;
    toolResults?: any[];
}

export class WorkflowManager {
    private static instance: WorkflowManager;
    private graph: StateGraph<WorkflowState>;
    private langchainConfig: LangChainConfig;
    private toolhouseConfig: ToolhouseConfig;

    private constructor() {
        this.langchainConfig = LangChainConfig.getInstance();
        this.toolhouseConfig = ToolhouseConfig.getInstance();
        this.graph = new StateGraph({ state: { messages: [], toolResults: [] } });
    }

    static getInstance(): WorkflowManager {
        if (!WorkflowManager.instance) {
            WorkflowManager.instance = new WorkflowManager();
        }
        return WorkflowManager.instance;
    }

    async initialize(): Promise<void> {
        try {
            thoughtLogger.log('info', 'Initializing workflow manager');

            // Initialize Toolhouse
            await this.toolhouseConfig.initialize();

            // Define workflow nodes with tool integration
            this.graph
                .addNode("process_input", this.processInput.bind(this))
                .addNode("analyze_code", this.analyzeCode.bind(this))
                .addNode("execute_tools", this.executeTools.bind(this))
                .addNode("generate_response", this.generateResponse.bind(this));

            // Define edges with tool execution
            this.graph
                .addEdge("process_input", "analyze_code")
                .addEdge("analyze_code", "execute_tools")
                .addEdge("execute_tools", "generate_response")
                .addEdge("generate_response", END);

            // Set entry point
            this.graph.setEntryPoint("process_input");

            thoughtLogger.log('success', 'Workflow manager initialized');
        } catch (error) {
            thoughtLogger.log('error', 'Failed to initialize workflow manager', { error });
            throw error;
        }
    }

    private async processInput(state: WorkflowState): Promise<WorkflowState> {
        const model = this.langchainConfig.getModel('anthropic');
        const tools = await this.toolhouseConfig.getToolsForProvider('anthropic');
        
        // Process input with tools
        const response = await model.invoke(state.messages[0].content, { tools });
        return {
            ...state,
            context: { toolCalls: response.toolCalls }
        };
    }

    private async analyzeCode(state: WorkflowState): Promise<WorkflowState> {
        const model = this.langchainConfig.getModel('groq');
        const tools = await this.toolhouseConfig.getToolsForProvider('anthropic');
        
        // Analyze code with tools
        const response = await model.invoke(state.messages[0].content, { tools });
        return {
            ...state,
            context: { 
                ...state.context,
                analysis: response
            }
        };
    }

    private async executeTools(state: WorkflowState): Promise<WorkflowState> {
        const toolhouse = this.toolhouseConfig.getToolhouse();
        
        if (state.context?.toolCalls) {
            const toolResults = await toolhouse.runTools(state.context.toolCalls);
            return {
                ...state,
                toolResults
            };
        }
        return state;
    }

    private async generateResponse(state: WorkflowState): Promise<WorkflowState> {
        const model = this.langchainConfig.getModel('perplexity');
        const tools = await this.toolhouseConfig.getToolsForProvider('anthropic');
        
        // Generate response using tool results
        const finalResponse = await model.invoke(
            state.messages[0].content,
            { 
                tools,
                context: state.toolResults 
            }
        );

        return {
            ...state,
            messages: [...state.messages, new ChatMessage(finalResponse)]
        };
    }

    async executeWorkflow(input: string): Promise<any> {
        try {
            thoughtLogger.log('info', 'Executing workflow', { input });
            const result = await this.graph.invoke({ 
                messages: [new ChatMessage(input)],
                context: {},
                toolResults: []
            });
            return result;
        } catch (error) {
            thoughtLogger.log('error', 'Workflow execution failed', { error });
            throw error;
        }
    }
} 
