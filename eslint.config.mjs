import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // demo/*.js are legacy fixture data/scripts (not part of the package); demo/main.ts is real code and gets linted.
    ignores: ['dist', 'node_modules', 'demo/*.js'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // Off: this plugin mixes plain objects into L.Class.extend() at runtime, inherently loose at its boundaries.
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['*.config.js', '*.config.mjs'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
