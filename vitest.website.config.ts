import {defineConfig} from 'vitest/config';
export default defineConfig({esbuild: {jsx: 'automatic'}, test: {include: ['tests/company-website-editor.test.tsx'], environment: 'node'}});
