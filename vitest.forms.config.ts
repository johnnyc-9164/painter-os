import { defineConfig } from 'vitest/config';
export default defineConfig({ esbuild: { jsx: 'automatic' }, test: { include: ['tests/estimate-form.test.tsx', 'tests/deadline-form.test.tsx', 'tests/bid-amount-form.test.tsx', 'tests/bid-status-form.test.tsx', 'tests/deposit-ui.test.tsx'], environment: 'node' } });
