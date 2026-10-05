import { defineConfig } from 'vitest/config';
/** Client-render states cannot be reached by anonymous SSR or local-only auth. */
export default defineConfig({ esbuild: { jsx: 'automatic' }, test: { include: ['tests/platform-render.test.tsx'], environment: 'node' } });
