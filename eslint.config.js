import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '.wrangler/**',
      '.worktrees/**',
      '.superpowers/**',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['workers/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
    rules: {
      // Ratchet: workers/ has a large pre-existing violation backlog.
      // Phase 1: editors surface violations as warnings; CI enforces a hard
      // budget via scripts/check-any-budget.mjs (see scripts/any-baseline.json).
      // Later phases re-enable rules as counts drop.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
