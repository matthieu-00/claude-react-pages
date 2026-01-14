/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    // React hooks correctness
    'react-hooks/rules-of-hooks': 'error',
    // This repo currently has many complex hooks; keep lint unblocked.
    'react-hooks/exhaustive-deps': 'off',

    // Vite React Fast Refresh
    'react-refresh/only-export-components': 'off',

    // Keep lint focused on correctness over style churn.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'prefer-const': 'off',
  },
};

