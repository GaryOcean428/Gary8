import { describe, it, expect, beforeEach } from 'vitest';
import { BundleManager, BundleConfig } from '../bundle-manager';
import { Toolhouse } from "@toolhouseai/sdk";
import { thoughtLogger } from '../../logging/thought-logger';

describe('BundleManager', () => {
    let bundleManager: BundleManager;
    let toolhouse: Toolhouse;

    beforeEach(() => {
        toolhouse = new Toolhouse({
            apiKey: process.env.TOOLHOUSE_API_KEY!,
            provider: "anthropic"
        });
        bundleManager = BundleManager.getInstance(toolhouse);
    });

    describe('createBundle', () => {
        it('should create a new bundle', async () => {
            const config: BundleConfig = {
                name: 'test-bundle',
                environment: 'development',
                tools: ['web-search', 'code-analysis']
            };

            await bundleManager.createBundle(config);
            const bundle = await bundleManager.getBundle('test-bundle');
            
            expect(bundle.config).toBeDefined();
            expect(bundle.config.name).toBe('test-bundle');
            expect(bundle.tools).toBeDefined();
        });

        it('should reject empty bundles', async () => {
            const config: BundleConfig = {
                name: 'empty-bundle',
                environment: 'development',
                tools: []
            };

            await expect(bundleManager.createBundle(config)).rejects.toThrow();
        });
    });

    describe('updateBundle', () => {
        it('should update existing bundle', async () => {
            const initialConfig: BundleConfig = {
                name: 'update-test',
                environment: 'development',
                tools: ['web-search']
            };

            await bundleManager.createBundle(initialConfig);
            await bundleManager.updateBundle('update-test', {
                tools: ['web-search', 'code-analysis']
            });

            const updated = await bundleManager.getBundle('update-test');
            expect(updated.config.tools).toHaveLength(2);
            expect(updated.config.version).toBe('1.0.1');
        });
    });

    describe('environment-specific bundles', () => {
        it('should get bundles for specific environment', async () => {
            await bundleManager.createBundle({
                name: 'dev-bundle',
                environment: 'development',
                tools: ['web-search']
            });

            await bundleManager.createBundle({
                name: 'prod-bundle',
                environment: 'production',
                tools: ['web-search']
            });

            const devBundles = bundleManager.getBundlesForEnvironment('development');
            expect(devBundles).toHaveLength(1);
            expect(devBundles[0].name).toBe('dev-bundle');
        });

        it('should get bundle for current environment', async () => {
            process.env.NODE_ENV = 'development';
            process.env.TOOLHOUSE_BUNDLE_VERSION = 'v1';

            const bundle = await bundleManager.getBundleForEnvironment();
            expect(bundle).toBeDefined();
            expect(bundle.config.environment).toBe('development');
        });
    });
}); 