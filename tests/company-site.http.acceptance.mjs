import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';

// Explicit local-only fixtures: no provider, session, secret or production data.
test('built company site serves isolated published journals and safe 404s', { timeout: 60000 }, async () => {
  const backend = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { path, args: [args] } = JSON.parse(body);
    assert.equal(path, 'painter:articles');
    const value = args.workspaceId === 'company-a' ? [{ id: 'a', title: 'Company A <script>alert(1)</script>', slug: 'care', content: 'Company A guidance', publishedAt: '2026-10-09', privateNotes: 'DO_NOT_PUBLISH' }] : args.workspaceId === 'company-b' ? [{ id: 'b', title: 'Company B', slug: 'care', content: 'Company B guidance', publishedAt: '2026-10-09' }] : [];
    res.setHeader('Content-Type', 'application/json');
    if (!['company-a', 'company-b'].includes(args.workspaceId)) res.end(JSON.stringify({ status: 'error', errorMessage: 'Missing workspace', errorData: 'PUBLIC_WORKSPACE_NOT_FOUND' }));
    else res.end(JSON.stringify({ status: 'success', value: args.slug && args.slug !== 'care' ? [] : value }));
  });
  backend.listen(0, '127.0.0.1');
  await once(backend, 'listening');
  const allocator = createServer();
  allocator.listen(0, '127.0.0.1');
  await once(allocator, 'listening');
  const port = allocator.address().port;
  await new Promise(resolve => allocator.close(resolve));
  const app = spawn(process.execPath, [new URL('../node_modules/next/dist/bin/next', import.meta.url).pathname, 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: new URL('../apps/company-site/', import.meta.url),
    env: { PATH: process.env.PATH, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_CONVEX_URL: `http://127.0.0.1:${backend.address().port}` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  app.stdout.on('data', chunk => { logs += chunk; });
  app.stderr.on('data', chunk => { logs += chunk; });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (app.exitCode !== null) throw new Error(`Company-site exited: ${logs}`);
      try { if ((await fetch(base)).status === 200) { ready = true; break; } } catch { /* bounded readiness retry */ }
      await delay(100);
    }
    assert.ok(ready, logs);
    const a = await fetch(`${base}/site/company-a`);
    assert.equal(a.status, 200);
    assert.equal(a.headers.get('x-frame-options'), 'DENY');
    const html = await a.text();
    assert.match(html, /Company A guidance/);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /DO_NOT_PUBLISH|Company B guidance|<script>alert\(1\)<\/script>/);
    const b = await fetch(`${base}/site/company-b/care`);
    assert.equal(b.status, 200);
    const bHtml = await b.text();
    assert.match(bHtml, /Company B guidance/);
    assert.doesNotMatch(bHtml, /Company A guidance/);
    for (const path of ['/site/missing', '/site/company-a/absent', '/site/company-a/care/extra', '/site/company-a/Bad_Slug']) {
      const missing = await fetch(base + path);
      assert.equal(missing.status, 404, path);
    }
  } finally {
    if (app.exitCode === null) {
      app.kill('SIGTERM');
      await Promise.race([once(app, 'exit'), delay(3000)]);
      if (app.exitCode === null) app.kill('SIGKILL');
    }
    await new Promise(resolve => backend.close(resolve));
  }
});
