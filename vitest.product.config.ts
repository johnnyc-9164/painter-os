import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['packages/backend/tests/*.test.ts'],environment:'edge-runtime'}});
