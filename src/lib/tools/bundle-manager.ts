import { thoughtLogger } from '../logging/thought-logger';
import { ErrorHandler } from '../utils/error-handler';
import { Toolhouse } from "@toolhouseai/sdk";

export interface BundleConfig {
    name: string;
    description?: string;
    environment: 'development' | 'staging' | 'production';
    version?: string;
    tools: string[];
}

export class BundleManager {
    private static instance: BundleManager;
    private toolhouse: Toolhouse;
    private bundles: Map<string, BundleConfig> = new Map();
    private currentEnvironment: string;

    private constructor(toolhouse: Toolhouse) {
        this.toolhouse = toolhouse;
        this.currentEnvironment = process.env.NODE_ENV || 'development';
    }

    static getInstance(toolhouse: Toolhouse): BundleManager {
        if (!BundleManager.instance) {
            BundleManager.instance = new BundleManager(toolhouse);
        }
        return BundleManager.instance;
    }

    async createBundle(config: BundleConfig): Promise<void> {
        try {
            thoughtLogger.log('info', `Creating bundle: ${config.name}`, { config });

            // Validate bundle configuration
            if (config.tools.length === 0) {
                throw new Error('Bundle must contain at least one tool');
            }

            // Store bundle configuration
            this.bundles.set(config.name, {
                ...config,
                version: config.version || '1.0.0'
            });

            thoughtLogger.log('success', `Bundle ${config.name} created`, {
                toolCount: config.tools.length
            });
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'create bundle');
        }
    }

    async getBundle(name: string): Promise<any> {
        try {
            thoughtLogger.log('info', `Getting bundle: ${name}`);
            
            // Get tools for the bundle
            const tools = await this.toolhouse.getTools({ bundle: name });
            
            return {
                config: this.bundles.get(name),
                tools
            };
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'get bundle');
        }
    }

    async getBundleForEnvironment(env: string = this.currentEnvironment): Promise<any> {
        const bundleName = `${env}-${process.env.TOOLHOUSE_BUNDLE_VERSION || 'v1'}`;
        return this.getBundle(bundleName);
    }

    async updateBundle(name: string, updates: Partial<BundleConfig>): Promise<void> {
        try {
            const existing = this.bundles.get(name);
            if (!existing) {
                throw new Error(`Bundle ${name} not found`);
            }

            // Update bundle configuration
            this.bundles.set(name, {
                ...existing,
                ...updates,
                version: this.incrementVersion(existing.version || '1.0.0')
            });

            thoughtLogger.log('success', `Bundle ${name} updated`);
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'update bundle');
        }
    }

    async deleteBundle(name: string): Promise<void> {
        try {
            if (!this.bundles.has(name)) {
                throw new Error(`Bundle ${name} not found`);
            }

            this.bundles.delete(name);
            thoughtLogger.log('success', `Bundle ${name} deleted`);
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'delete bundle');
        }
    }

    private incrementVersion(version: string): string {
        const [major, minor, patch] = version.split('.').map(Number);
        return `${major}.${minor}.${patch + 1}`;
    }

    getAllBundles(): BundleConfig[] {
        return Array.from(this.bundles.values());
    }

    getBundlesForEnvironment(env: string): BundleConfig[] {
        return this.getAllBundles().filter(bundle => bundle.environment === env);
    }
} 