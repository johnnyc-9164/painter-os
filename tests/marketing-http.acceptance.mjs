import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicAdminOrigin } from '../packages/backend/published-articles.mjs';

export async function marketingHttpAcceptance(base, expectedAdminOrigin = null, expectedSiteOrigin = null) {
  const parsed = new URL(base);
  assert.equal(parsed.protocol, 'http:');
  assert.equal(parsed.hostname, '127.0.0.1');
  const origin = publicAdminOrigin(expectedAdminOrigin ?? undefined);
  const response = await fetch(base, { redirect: 'error', signal: AbortSignal.timeout(10_000) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('set-cookie'), null, 'Public landing establishes no auth session');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const html = await response.text();
  assert.ok(html.length < 1024 * 1024, 'Bounded HTML fixture');
  assert.match(html, /Run a smoother/);
  assert.match(html, /painting business/);
  assert.equal((html.match(/<h3(?:\s[^>]*)?>/g) || []).length, 8);
  for (const section of ['features', 'workflow', 'ownership']) {
    assert.match(html, new RegExp(`id="${section}"`));
    assert.match(html, new RegExp(`href="${section==='workflow'?'/workflow':'#'+section}"`));
  }
  assert.match(html, /manually recorded customer payments/);
  assert.match(html, /customer-owned deployments/);
  assert.doesNotMatch(html, /free trial|thousands of|trusted by|BETTER_AUTH_SECRET|CONVEX_DEPLOY_KEY|PAINTER_LINK_SECRET/i);
  assert.match(html, /Workspace illustration/);
  assert.match(html, /Example data/);
  assert.equal((html.match(/<img\b/g) || []).length, 2, 'Two materialized decorative photographs');
  for (const name of ['painter-hero-v2', 'house-van']) {
    const asset = await fetch(`${base}/images/product/${name}.webp`, { signal: AbortSignal.timeout(10_000) });
    assert.equal(asset.status, 200, name);
    assert.match(asset.headers.get('content-type'), /image\/webp/);
    const bytes = Buffer.from(await asset.arrayBuffer());
    assert.ok(bytes.length > 1024 && bytes.length < 500_000, `${name} bounded real image payload`);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
  const optimized = await fetch(`${base}/_next/image?url=%2Fimages%2Fproduct%2Fpainter-hero-v2.webp&w=640&q=75`, { signal: AbortSignal.timeout(20_000) });
  assert.equal(optimized.status, 200, 'Actual Next image optimizer serves the hero');
  assert.match(optimized.headers.get('content-type'), /image\//);
  const anchorPattern = /<a\b[^>]*href="([^"]+)"[^>]*>/g;
  const hrefs = [...html.matchAll(anchorPattern)].map(match => match[1]);
  assert.ok(hrefs.length > 4, 'Actual rendered navigation/CTA anchors');
  assert.doesNotMatch(html, /<a\b[^>]*role="button"/, 'Navigation CTAs preserve link semantics');
  for (const href of hrefs) assert.ok(['/', '/product', '/workflow', '/resources', '/workspace-options'].includes(href) || href.startsWith('#') || (origin !== null && href === origin), `Unexpected landing destination: ${href}`);
  if (origin) {
    assert.ok(hrefs.includes(origin));
    assert.match(html, /Open your workspace/);
    assert.match(html, /Sign in/);
  } else {
    assert.doesNotMatch(html, /Open your workspace|Sign in/);
  }
  const paths=['/','/product','/workflow','/resources','/resources/estimate-handoff','/resources/job-closeout','/workspace-options'];
  const titles=new Set(),descriptions=new Set();
  for(const path of paths){
    const page=await fetch(base+path,{redirect:'error'});assert.equal(page.status,200,path);assert.equal(page.headers.get('set-cookie'),null);
    const body=await page.text();assert.equal((body.match(/<h1(?:\s[^>]*)?>/g)||[]).length,1,path);
    const title=body.match(/<title>(.*?)<\/title>/)?.[1];assert.ok(title,path);assert.ok(!titles.has(title),`Unique title ${path}`);titles.add(title);
    const description=body.match(/<meta name="description" content="([^"<>]+)"/)?.[1];assert.ok(description,path);assert.ok(!descriptions.has(description),`Unique description ${path}`);descriptions.add(description);
    assert.match(body,/aria-label="Product navigation"/);
    if(origin){assert.ok(body.includes(`data-workspace="true"`),path);assert.ok(body.includes(`href="${origin}"`),path);assert.match(body,/Sign in/);}
    if(path!=='/')assert.match(body,/class="product-skip-link" href="#product-content"/);
    if(expectedSiteOrigin){assert.ok(body.includes(`rel="canonical" href="${expectedSiteOrigin+path}"`),path);assert.match(body,/<meta name="robots" content="index, follow"/);assert.ok(body.includes(`property="og:url" content="${expectedSiteOrigin+path}"`));}
    else{assert.doesNotMatch(body,/rel="canonical"/);assert.match(body,/<meta name="robots" content="noindex, follow"/);}
  }
  const robots=await(await fetch(base+'/robots.txt')).text();assert.match(robots,/Allow: \/\n/);assert.match(robots,/Disallow: \/api\//);assert.doesNotMatch(robots,/Disallow: \/(?:site\/)?\n/);
  const sitemap=await(await fetch(base+'/sitemap.xml')).text();assert.equal((sitemap.match(/<loc>/g)||[]).length,expectedSiteOrigin?7:0);
  if(expectedSiteOrigin)for(const path of paths)assert.ok(sitemap.includes(`<loc>${expectedSiteOrigin+path}</loc>`));
  assert.doesNotMatch(sitemap,/\/site\/|lastmod/);
  // This checks absent app surfaces, not live tenant projection or Convex availability.
  for (const path of ['/api/snapshot', '/api/auth', '/dashboard', '/platform', '/p/synthetic-token', '/i/synthetic-token']) {
    const denied = await fetch(base + path, { redirect: 'error', signal: AbortSignal.timeout(10_000) });
    assert.equal(denied.status, 404, `${path} is not part of the public marketing deployment`);
    assert.equal(denied.headers.get('set-cookie'), null);
  }
  console.log(`Built marketing HTTP acceptance PASS: content, eight cards, anchor destinations, ${origin ? 'configured build-origin' : 'absent build-origin'} CTA, materialized imagery/image optimizer, headers and six absent admin/portal surfaces. No browser/valid-tenant/visual claim.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  marketingHttpAcceptance(process.env.PAINTER_MARKETING_TEST_URL, process.env.PAINTER_EXPECTED_BUILD_ADMIN_ORIGIN || null, process.env.PAINTER_EXPECTED_BUILD_MARKETING_ORIGIN || null).catch(error => { console.error(error); process.exitCode = 1; });
}

