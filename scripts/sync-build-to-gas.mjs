import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const rootDir = resolve(process.cwd());
const distDir = resolve(rootDir, 'frontend/dist');
const distHtmlPath = resolve(distDir, 'index.html');
const gasIndexPath = resolve(rootDir, 'gas/src/Index.html');

const html = await readFile(distHtmlPath, 'utf8');

const stylesheetHrefs = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map(
  (match) => match[1]
);

const scriptSrcList = [...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)].map(
  (match) => match[1]
);

if (scriptSrcList.length === 0) {
  throw new Error('No module script found in frontend/dist/index.html');
}

const inlineStyles = await Promise.all(
  stylesheetHrefs.map(async (href) => {
    const absolute = resolve(distDir, href.replace(/^\//, ''));
    return readFile(absolute, 'utf8');
  })
);

const inlineScripts = await Promise.all(
  scriptSrcList.map(async (src) => {
    const absolute = resolve(distDir, src.replace(/^\//, ''));
    return readFile(absolute, 'utf8');
  })
);

const builtAt = new Date().toISOString();
const compiled = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Anime Production Scheduler</title>
    <style>
${inlineStyles.join('\n')}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
    </script>
    <script type="module">
${inlineScripts.join('\n')}
    </script>
    <!-- synced at ${builtAt} -->
  </body>
</html>
`;

await writeFile(gasIndexPath, compiled, 'utf8');
console.log(`Synced frontend build to ${gasIndexPath}`);
