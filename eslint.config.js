import javascript from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import typescript from 'typescript-eslint';

const usePlatformModule = 'Go through a module in app/platform or app/api, so the page can run elsewhere and tests can stand in.';
const platformGlobals = ['fetch', 'localStorage', 'sessionStorage', 'navigator', 'confirm', 'alert', 'prompt', 'open'];

export default defineConfig([
  globalIgnores(['dist', '.wrangler']),
  javascript.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ['test/**/*.js', 'vite.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['app/**/*.{ts,tsx}', 'vite.config.ts'],
    extends: [typescript.configs.strict],
  },
  {
    files: ['app/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['app/**/*.{ts,tsx}'],
    ignores: ['app/platform/**', 'app/api/**', 'app/test/**', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-globals': ['error', ...platformGlobals.map((name) => ({ name, message: usePlatformModule }))],
      'no-restricted-properties': ['error',
        ...platformGlobals.map((property) => ({ object: 'window', property, message: usePlatformModule })),
        { object: 'navigator', property: 'clipboard', message: usePlatformModule },
        { object: 'navigator', property: 'share', message: usePlatformModule },
      ],
    },
  },
]);
