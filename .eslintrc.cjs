module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.base.json',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  overrides: [
    {
      files: ['apps/*/src/**/*.ts', 'apps/*/src/**/*.tsx'],
      parserOptions: {
        project: ['./apps/*/tsconfig.json'],
      },
    },
    {
      files: ['packages/*/src/**/*.ts'],
      parserOptions: {
        project: ['./packages/*/tsconfig.json'],
      },
    },
  ],
};
