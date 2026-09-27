import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { createPortsmouthControlledLocalityPreview } from '../src/data/geography/portsmouth-controlled-locality-preview.ts';
const require = createRequire(import.meta.url);
const { webpack } = require('next/dist/compiled/webpack/webpack');
const { chromium } = require(require.resolve('playwright', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ?? process.cwd(), process.cwd()] }));
const root = process.cwd();
const output = await mkdtemp(path.join(tmpdir(), 'rfx-runtime-'));
const navigation = path.join(root, 'test/browser/navigation.mjs');
let browser, server;
try {
  await new Promise((resolve, reject) => webpack({ mode: 'development', context: root, entry: './test/browser/exchange-fixture.mjs', output: { path: output, filename: 'runtime.js', publicPath: '/' }, devtool: false,
    resolve: { extensions: ['.tsx','.ts','.mjs','.js','.json'], alias: { '@': root, 'next/navigation$': navigation, 'next/link$': navigation, 'mapbox-gl$': path.join(root,'test/browser/mapbox.mjs') } },
    module: { rules: [{ test: /\.mjs$/, resolve: { fullySpecified: false } }, { test: /\.(?:tsx?|css)$/, exclude: /node_modules/, use: path.join(root, 'test/browser/runtime-loader.cjs') }] },
    plugins: [new (require('next/dist/compiled/webpack/webpack').webpack.DefinePlugin)({ 'process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN': JSON.stringify('pk.runtime-test-double') })]
  }, (error, stats) => error || stats.hasErrors() ? reject(error ?? new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  const fixture = { model: await createPortsmouthControlledLocalityPreview() };
  await writeFile(path.join(output,'index.html'), `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><script>window.fixture=${JSON.stringify(fixture).replace(/</g,'\\u003c')}</script><script src="/runtime.js"></script>`);
  server = createServer(async (request, response) => {
    const filename = request.url.endsWith('.js') ? path.basename(request.url) : 'index.html';
    try { response.setHeader('content-type', filename.endsWith('.js') ? 'application/javascript' : 'text/html'); response.end(await readFile(path.join(output,filename))); } catch { response.statusCode = 404; response.end(); }
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  browser = await chromium.launch({ headless: true, executablePath: process.env.RFXCHANGE_CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox'] });
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/opportunities`);
    await page.waitForSelector('[data-map-ready="true"]');
    assert.equal(await page.locator('[data-participant-shell="persistent"]').count(), 1);
    const first = await page.evaluate(() => { window.firstMap = window.maps.find(m => !m.removed); return { live: window.maps.filter(m => !m.removed).length, style: window.firstMap.options.style, pitch: window.firstMap.options.pitch, loads: window.sdkLoads }; });
    assert.equal(first.live, 1); assert.equal(first.style, 'mapbox://styles/mapbox/light-v11'); assert.equal(first.pitch, 0); assert.equal(first.loads, 1);
    assert.equal(await page.evaluate(() => window.firstMap.options.container.contains(document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2))), true, 'Uncovered map receives pointer input');
    assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)', 'Page overlay leaves the persistent map visible');
    await page.locator('#update-record').click();
    await page.waitForFunction(() => window.firstMap.sources.get('rfx-spatial-scene-network-organizations')?.data.features.some(x => x.properties.label === 'Record 2'));
    await page.evaluate(() => window.go('/resources'));
    await page.waitForSelector('main[aria-label="resources"]');
    assert.equal(await page.evaluate(() => window.firstMap === window.maps.find(m => !m.removed)), true, 'Lens route changes retain one map instance');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'No horizontal overflow');
    await page.evaluate(() => window.go('/signin'));
    await page.waitForSelector('main');
    await page.waitForFunction(() => window.maps.every(m => m.removed));
    assert.equal(await page.locator('[data-participant-shell="persistent"]').count(), 0);
    assert.deepEqual(errors, []);
    console.log(`Exchange lifecycle passed at ${viewport.width}x${viewport.height} (SDK/data doubles).`);
    await page.close();
  }
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await rm(output, { recursive: true, force: true });
}
