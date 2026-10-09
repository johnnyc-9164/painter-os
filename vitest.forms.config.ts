import { defineConfig } from 'vitest/config';
export default defineConfig({ esbuild: { jsx: 'automatic' }, test: { include: ['tests/estimate-form.test.tsx', 'tests/deadline-form.test.tsx'], environment: 'node' } });
