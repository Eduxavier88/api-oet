module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  env: {
    node: true,
    jest: true,
    es2020: true,
  },
  globals: {
    process: 'readonly',
    Buffer: 'readonly',
    setTimeout: 'readonly',
  },
  rules: {
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-useless-escape': 'off',
    'no-useless-catch': 'off',
    
    // NestJS specific
    'class-methods-use-this': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '*.js',
    '*.d.ts',
  ],
};
