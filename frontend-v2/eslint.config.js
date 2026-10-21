import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['node_modules/**', 'dist/**', 'coverage/**']),

  {
    files: ['**/*.{js,jsx}'],

    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],

    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^(React|_.*)$',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],

      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  {
    // Route tables and app registry export configuration data.
    files: ['src/router/routes/**', 'src/apps/registry.jsx'],

    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  {
    // Node.js globals for Vite and ESLint configuration files.
    files: ['vite.config.js', 'eslint.config.js', 'eslint.config.mjs'],

    languageOptions: {
      globals: globals.node,
    },
  },
]);
