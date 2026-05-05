import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';
import { notaReactStrictRules } from '../../tools/eslint-react-strict.mjs';

export default [
  {
    ignores: ['**/out-tsc', '**/dist'],
  },
  ...nx.configs['flat/react'],
  ...baseConfig,
  notaReactStrictRules,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {},
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/require-await': 'warn',
    },
  },
];
