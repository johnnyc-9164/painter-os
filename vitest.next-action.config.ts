import { defineConfig } from 'vitest/config';
export default defineConfig({ esbuild: { jsx: 'automatic' }, test: { include: ['tests/next-action-panel.test.tsx'], environment: 'node' } });
