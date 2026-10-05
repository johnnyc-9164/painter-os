import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { productImagery } from '../apps/marketing/src/components/product/imagery';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

function renderLanding(props: { adminOrigin: string | null }) {
  // A fresh process makes the app's automatic JSX transform apply to shared UI too.
  const require = createRequire(import.meta.url);
  const result = spawnSync(process.execPath, [
    require.resolve('tsx/cli'), '--tsconfig',
    fileURLToPath(new URL('../apps/marketing/tsconfig.json', import.meta.url)),
    fileURLToPath(new URL('./fixtures/product-landing/render.tsx', import.meta.url)),
    props.adminOrigin || '',
  ], { encoding: 'utf8', timeout: 20000, env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot } });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout).html as string;
}

test('product landing renders eight capabilities and no unconfigured workspace link', () => {
  const html = renderLanding({ adminOrigin: null });
  assert.equal((html.match(/<h3>/g) || []).length, 8);
  assert.match(html, /href="#workflow"/);
  assert.doesNotMatch(html, /Open your workspace|Sign in|\/api\/snapshot|\/api\/auth|free trial|thousands of|trusted by/i);
  assert.match(html, /manually recorded customer payments/);
  assert.match(html, /customer-owned deployments/);
});

test('configured workspace CTA uses only the supplied public origin', () => {
  const html = renderLanding({ adminOrigin: 'https://workspace.example.test' });
  assert.match(html, /href="https:\/\/workspace\.example\.test"/);
  assert.match(html, /Open your workspace/);
  assert.doesNotMatch(html, /href="\/(dashboard|platform|settings)/);
});

test('unavailable imagery emits no broken asset requests; activated payloads must be actual images', () => {
  const html = renderLanding({ adminOrigin: null });
  const images = Object.values(productImagery).filter(image => image !== null);
  if (images.length === 0) assert.doesNotMatch(html, /<img|\/images\/product\//);
  for (const image of images) {
    const data = readFileSync(new URL(`../apps/marketing/public${image.src}`, import.meta.url));
    assert.ok(data.length > 1024, image.src);
    const webp = data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP';
    const png = data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = data[0] === 255 && data[1] === 216 && data[2] === 255;
    assert.ok(webp || png || jpeg, `Unsupported/nonimage asset: ${image.src}`);
  }
});
