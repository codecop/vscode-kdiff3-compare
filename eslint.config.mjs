import js from '@eslint/js';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', '*.vsix']
  },
  js.configs.all,
  unicorn.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    }
  },
  {
    rules: {
      'no-magic-numbers': 'off',
      'one-var': 'off',
      'sort-keys': 'off',
      'func-style': 'off',
      'unicorn/prefer-module': 'off',
      'no-undefined': 'off',
      'unicorn/no-useless-undefined': 'off'
    }
  }
];
