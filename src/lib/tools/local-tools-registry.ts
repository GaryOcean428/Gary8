import { Toolhouse } from "@toolhouseai/sdk";
import { thoughtLogger } from "../logging/thought-logger";
import { z } from "zod";

export class LocalToolsRegistry {
    private static instance: LocalToolsRegistry;
    private toolhouse: Toolhouse;
    private localTools: Map<string, Function> = new Map();

    private constructor(toolhouse: Toolhouse) {
        this.toolhouse = toolhouse;
    }

    static getInstance(toolhouse: Toolhouse): LocalToolsRegistry {
        if (!LocalToolsRegistry.instance) {
            LocalToolsRegistry.instance = new LocalToolsRegistry(toolhouse);
        }
        return LocalToolsRegistry.instance;
    }

    registerLocalTool(name: string, description: string, schema: z.ZodObject<any>, handler: Function) {
        try {
            // Register with Toolhouse decorator
            this.toolhouse.register_local_tool(name)(handler);

            // Store locally
            this.localTools.set(name, handler);

            // Define tool schema
            const toolDefinition = {
                name,
                description,
                input_schema: {
                    type: "object",
                    properties: this.convertZodToJsonSchema(schema),
                    required: Object.keys(schema.shape)
                }
            };

            thoughtLogger.log('success', `Local tool ${name} registered`, { toolDefinition });
            return toolDefinition;
        } catch (error) {
            thoughtLogger.log('error', `Failed to register local tool ${name}`, { error });
            throw error;
        }
    }

    private convertZodToJsonSchema(schema: z.ZodObject<any>) {
        const properties: Record<string, any> = {};
        
        Object.entries(schema.shape).forEach(([key, value]) => {
            if (value instanceof z.ZodString) {
                properties[key] = { type: "string" };
            } else if (value instanceof z.ZodNumber) {
                properties[key] = { type: "number" };
            } else if (value instanceof z.ZodBoolean) {
                properties[key] = { type: "boolean" };
            }
            // Add description if available
            if (value.description) {
                properties[key].description = value.description;
            }
        });

        return properties;
    }

    getLocalTools(): Record<string, any>[] {
        return Array.from(this.localTools.entries()).map(([name, handler]) => ({
            name,
            handler
        }));
    }
} 