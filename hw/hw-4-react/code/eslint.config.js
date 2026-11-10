import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{js,jsx}'],
        extends: [
            js.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        plugins: {
            'simple-import-sort': simpleImportSort,
        },
        rules: {
            indent: ['error', 4],
            semi: ['error', 'always'],
            'simple-import-sort/imports': ['error', {
                groups: [
                    ['^@/'],
                    ['^\\.\\./'],
                    ['^\\./', '^\\u0000\\./'],
                    ['^'],
                ],
            }],
        },
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
    },
]);
