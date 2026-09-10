module.exports = {
  root: true,
  extends: ['@faro/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: { node: true, jest: true },
  ignorePatterns: ['dist', 'node_modules', 'test'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
