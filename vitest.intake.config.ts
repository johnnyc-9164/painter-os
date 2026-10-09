import { defineConfig } from 'vitest/config';
export default defineConfig({esbuild: {jsx: 'automatic'}, test: {include: ['tests/intake-render.test.tsx'], environment: 'node'}});
