import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { productFeatures } from '../apps/marketing/src/components/product/content';
import { productImagery } from '../apps/marketing/src/components/product/imagery';

test('product content describes eight concrete capabilities without invented proof', () => {
  assert.equal(productFeatures.length, 8);
  assert.equal(new Set(productFeatures.map(feature => feature.icon)).size, 8);
  const copy = productFeatures.map(feature => `${feature.title} ${feature.description}`).join(' ');
  assert.match(copy, /manually recorded customer payments/);
  assert.doesNotMatch(copy, /free trial|thousands of|trusted by|automatic payment collection/i);
});

test('home validates optional origin and uses the product composition instead of tenant data', () => {
  const home = readFileSync(new URL('../apps/marketing/src/app/page.tsx', import.meta.url), 'utf8');
  assert.match(home, /publicAdminOrigin\(process\.env\.NEXT_PUBLIC_ADMIN_ORIGIN\)/);
  assert.match(home, /ProductLanding/);
  assert.doesNotMatch(home, /readPublishedArticles|\/api\/snapshot|auth-client|local-runtime/);
  const composition = readFileSync(new URL('../apps/marketing/src/components/product/product-landing.tsx', import.meta.url), 'utf8');
  assert.match(composition, /customer-owned deployments/);
  assert.match(composition, /adminOrigin \?/);
  assert.doesNotMatch(composition, /href="\/(dashboard|platform|settings)/);
});

test('activated image registry entries require materialized payloads', () => {
  for (const image of Object.values(productImagery).filter(image => image !== null)) {
    const data = readFileSync(new URL(`../apps/marketing/public${image.src}`, import.meta.url));
    assert.ok(data.length > 1024, image.src);
    const webp = data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP';
    const png = data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = data[0] === 255 && data[1] === 216 && data[2] === 255;
    assert.ok(webp || png || jpeg, `Unsupported/nonimage asset: ${image.src}`);
  }
});
