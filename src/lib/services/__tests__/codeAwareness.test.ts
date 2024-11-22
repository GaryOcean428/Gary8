import { describe, it, expect, beforeEach } from 'vitest';
import { CodeAwareness } from '../codeAwareness';
import { thoughtLogger } from '../../logging/thought-logger';

describe('CodeAwareness', () => {
    let codeAwareness: CodeAwareness;

    beforeEach(async () => {
        codeAwareness = CodeAwareness.getInstance();
        await codeAwareness.initialize();
    });

    describe('analyzeCode', () => {
        it('should detect imports correctly', async () => {
            const code = `
                import React from 'react';
                import { useState } from 'react';
                import axios from 'axios';
            `;

            const result = await codeAwareness.analyzeCode(code);
            expect(result.dependencies).toContain('react');
            expect(result.dependencies).toContain('axios');
        });

        it('should identify functions and classes', async () => {
            const code = `
                function testFunction() {}
                class TestClass {}
            `;

            const result = await codeAwareness.analyzeCode(code);
            expect(result.capabilities).toContainEqual(expect.objectContaining({
                name: 'testFunction',
                type: 'function'
            }));
            expect(result.capabilities).toContainEqual(expect.objectContaining({
                name: 'TestClass',
                type: 'class'
            }));
        });

        it('should calculate complexity', async () => {
            const code = `
                function test() {
                    if (true) {
                        while (true) {
                            for (let i = 0; i < 10; i++) {
                                switch (i) {
                                    case 1: break;
                                }
                            }
                        }
                    }
                }
            `;

            const result = await codeAwareness.analyzeCode(code);
            expect(result.complexity).toBe(4); // if, while, for, switch
        });

        it('should generate appropriate suggestions', async () => {
            const complexCode = Array(11).fill('if (true) {}').join('\n');
            
            const result = await codeAwareness.analyzeCode(complexCode);
            expect(result.suggestions).toContain('Consider breaking down complex functions into smaller ones');
        });
    });
}); 