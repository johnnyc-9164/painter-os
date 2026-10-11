import {defineConfig} from 'vitest/config';
export default defineConfig({esbuild:{jsx:'automatic'},test:{include:['tests/pi-run-viewer-render.test.tsx'],environment:'node'}});
