import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  // Base JS recommended rules
  js.configs.recommended,
  // Enable browser & Node globals and disable undefined checks
  {
    // Define known globals for JS files and disable undefined variable checks
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // TS handles undefined checks; disable no-undef
      'no-undef': 'off',
      // Disable unused variable checks in JS files
      'no-unused-vars': 'off',
    },
  },

  // Ignore build output
  {
    ignores: ['dist'],
  },

  // TypeScript and React Hooks/Refresh rules
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Base recommended rules
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Relax noisy rules
      'react-refresh/only-export-components': 'off',
      'no-case-declarations': 'off',
      // Explicit any should warn, not error
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow unused vars prefixed with _
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Disable duplicate declaration checks (TS handles merging)
      'no-redeclare': 'off',
      // Disable useless catch clause warning
      'no-useless-catch': 'off',
      // Allow unused expressions
      'no-unused-expressions': 'off',
      // Allow unused expressions in TS
      '@typescript-eslint/no-unused-expressions': 'off',
      // Disable useless escape warnings
      'no-useless-escape': 'off',
      // Allow require-style imports
      '@typescript-eslint/no-require-imports': 'off',
      // Disable hook rules in legacy/component files
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  // Supabase edge functions: relax undefined globals
  {
    files: ['supabase/functions/**/*.ts'],
    rules: {
      'no-undef': 'off',
    },
  },
];
