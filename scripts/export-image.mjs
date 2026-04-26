#!/usr/bin/env node
import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const DEFAULT_SELECTOR = '.preview-content-for-export';
const DEFAULT_OUTPUT = path.resolve(process.cwd(), 'exports', 'wechat-article.png');
const DEFAULT_DIST_DIR = path.resolve(process.cwd(), 'dist');
const CHROME_ENV_KEYS = ['CHROME_PATH', 'CHROME_BIN', 'PUPPETEER_EXECUTABLE_PATH', 'PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'];
const CHROME_EXECUTABLE_CANDIDATES = [
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
  'chrome',
  'msedge',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.input) {
  usage();
  process.exit(args.help ? 0 : 1);
}

const inputPath = path.resolve(args.input);
const outputPath = path.resolve(args.output || process.env.EXPORT_IMAGE_OUTPUT || DEFAULT_OUTPUT);
const selector = args.selector || DEFAULT_SELECTOR;
const pixelRatio = Number(args.pixelRatio || 2);

let chromeProcess;
let chromeUserDataDir;
let localAppDir;

try {
  const blocks = await readBlocks(inputPath);
  const url = args.url || await prepareLocalAppUrl(args.dist || DEFAULT_DIST_DIR);
  const browser = await startChrome();

  await browser.send('Page.enable');
  await browser.send('Runtime.enable');
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1200,
    deviceScaleFactor: pixelRatio,
    mobile: false,
  });

  await browser.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('editor_draft', ${JSON.stringify(JSON.stringify({
      blocks,
      savedAt: Date.now(),
    }))});`,
  });
  await navigate(browser, url);
  await openPreview(browser);
  await waitForSelector(browser, selector);
  await waitForExportBlocks(browser, blocks.length);
  await waitForFonts(browser);

  const rect = await getElementRect(browser, selector);
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: Math.max(1440, Math.ceil(rect.x + rect.width + 40)),
    height: Math.max(1200, Math.ceil(rect.y + rect.height + 40)),
    deviceScaleFactor: pixelRatio,
    mobile: false,
  });

  const screenshot = await browser.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: true,
    clip: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      scale: 1,
    },
  });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(screenshot.data, 'base64'));
  console.log(`Exported ${outputPath}`);
} finally {
  if (chromeProcess) chromeProcess.kill('SIGTERM');
  if (chromeUserDataDir) {
    await fs.rm(chromeUserDataDir, { recursive: true, force: true });
  }
  if (localAppDir) {
    await fs.rm(localAppDir, { recursive: true, force: true });
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input' || arg === '-i') parsed.input = argv[++i];
    else if (arg === '--output' || arg === '-o') parsed.output = argv[++i];
    else if (arg === '--url') parsed.url = argv[++i];
    else if (arg === '--dist') parsed.dist = argv[++i];
    else if (arg === '--debugging-port') parsed.debuggingPort = argv[++i];
    else if (arg === '--selector') parsed.selector = argv[++i];
    else if (arg === '--pixel-ratio') parsed.pixelRatio = argv[++i];
    else if (arg === '--chrome') parsed.chrome = argv[++i];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
    else if (!parsed.input) parsed.input = arg;
    else if (!parsed.output) parsed.output = arg;
  }
  return parsed;
}

function usage() {
  console.error(`Usage: node scripts/export-image.mjs --input template.json

Default output:
  ${DEFAULT_OUTPUT}

Options:
  --output <path>         Output PNG path, defaults to ./exports/wechat-article.png
  --url <url>             Use an explicit editor URL instead of the local dist build
  --dist <path>           Built app directory, default ./dist. No dev server is started
  --debugging-port <port> Preferred Chrome remote debugging port
  --selector <selector>   Export target selector, default ${DEFAULT_SELECTOR}
  --pixel-ratio <number>  Device scale factor, default 2
  --chrome <path>         Chrome executable path. Also supports ${CHROME_ENV_KEYS.join(', ')}
                         If Playwright installed Chromium, the ms-playwright cache is auto-detected
  EXPORT_IMAGE_OUTPUT     Output path environment variable`);
}

async function readBlocks(filePath) {
  const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const blocks = Array.isArray(data) ? data : data.blocks;
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error('Input must be a non-empty blocks array or an object with blocks.');
  }
  return blocks;
}

async function prepareLocalAppUrl(distDir) {
  const resolvedDistDir = path.resolve(distDir);
  const indexPath = path.join(resolvedDistDir, 'index.html');
  if (!await fileExists(indexPath)) {
    throw new Error(`Built app not found at ${indexPath}. Run pnpm build before export, or pass --url explicitly.`);
  }

  localAppDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wechat-export-app-'));
  const html = await createStandaloneHtml(indexPath, resolvedDistDir);
  const standaloneIndexPath = path.join(localAppDir, 'index.html');
  await fs.writeFile(standaloneIndexPath, html);
  return `${pathToFileURL(standaloneIndexPath).href}#/`;
}

async function createStandaloneHtml(indexPath, distDir) {
  let html = await fs.readFile(indexPath, 'utf8');

  html = await replaceAsync(
    html,
    /<link\b([^>]*?)href="([^"]+\.css)"([^>]*)>/g,
    async (_match, beforeHref, href, afterHref) => {
      const cssPath = resolveDistAssetPath(href, distDir);
      let css = await fs.readFile(cssPath, 'utf8');
      css = rewriteCssAssetUrls(css, path.dirname(cssPath));
      return `<style data-export-inline="css"${beforeHref}${afterHref}>${css}</style>`;
    },
  );

  html = await replaceAsync(
    html,
    /<script\b([^>]*?)src="([^"]+\.js)"([^>]*)><\/script>/g,
    async (_match, beforeSrc, src, afterSrc) => {
      const jsPath = resolveDistAssetPath(src, distDir);
      const js = await fs.readFile(jsPath, 'utf8');
      return `<script${beforeSrc}${afterSrc}>${js}</script>`;
    },
  );

  return html.replace(/\s*<link\b[^>]*rel="icon"[^>]*>/g, '');
}

function resolveDistAssetPath(assetUrl, distDir) {
  const cleanAssetUrl = assetUrl.split(/[?#]/)[0];
  return path.join(distDir, cleanAssetUrl.replace(/^\/+/, ''));
}

function rewriteCssAssetUrls(css, cssDir) {
  return css.replace(/url\((['"]?)(?!data:|https?:|file:|#)([^'")]+)\1\)/g, (_match, quote, assetUrl) => {
    const [assetPath, suffix = ''] = assetUrl.split(/(?=[?#])/);
    const resolvedAssetPath = path.resolve(cssDir, assetPath);
    return `url(${quote}${pathToFileURL(resolvedAssetPath).href}${suffix}${quote})`;
  });
}

async function replaceAsync(value, pattern, replacer) {
  const replacements = [];
  value.replace(pattern, (...args) => {
    replacements.push(replacer(...args));
    return '';
  });
  const resolvedReplacements = await Promise.all(replacements);
  let index = 0;
  return value.replace(pattern, () => resolvedReplacements[index++]);
}

async function getFreePort(preferred) {
  for (let port = preferred; port < preferred + 50; port += 1) {
    if (await canListen(port)) return port;
  }
  throw new Error(`No free port found near ${preferred}.`);
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '127.0.0.1');
  });
}

async function startChrome() {
  const chromePath = await resolveChromeExecutable(args.chrome);
  chromeUserDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wechat-export-chrome-'));
  const debuggingPort = await getFreePort(Number(args.debuggingPort || 9222));
  const chromeLogs = [];

  chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--allow-file-access-from-files',
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${chromeUserDataDir}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  chromeProcess.stderr.on('data', (chunk) => chromeLogs.push(chunk.toString()));

  const endpoint = await waitForWebSocketEndpoint(debuggingPort, chromeLogs);
  return connectCdp(endpoint);
}

async function resolveChromeExecutable(cliChromePath) {
  const explicitChromePath = cliChromePath || CHROME_ENV_KEYS.map((key) => process.env[key]).find(Boolean);
  if (explicitChromePath) {
    if (await isExecutable(explicitChromePath)) return explicitChromePath;
    throw new Error(`Chrome executable was set but is not executable: ${explicitChromePath}`);
  }

  const candidates = [
    ...CHROME_EXECUTABLE_CANDIDATES,
    ...await getPlaywrightBrowserCandidates(),
  ];

  for (const candidate of candidates) {
    const executable = path.isAbsolute(candidate) ? candidate : await findInPath(candidate);
    if (executable && await isExecutable(executable)) return executable;
  }

  throw new Error(
    'Chrome/Chromium executable was not found. Install Chrome/Chromium in the sandbox, ' +
    'run `npx -y playwright@latest install chromium`, or set --chrome, CHROME_PATH, CHROME_BIN, ' +
    'PUPPETEER_EXECUTABLE_PATH, or PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.',
  );
}

async function getPlaywrightBrowserCandidates() {
  const browserRoots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH && process.env.PLAYWRIGHT_BROWSERS_PATH !== '0'
      ? process.env.PLAYWRIGHT_BROWSERS_PATH
      : null,
    path.join(os.homedir(), '.cache', 'ms-playwright'),
    path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'),
    path.join(process.env.LOCALAPPDATA || '', 'ms-playwright'),
  ].filter(Boolean);

  const candidates = [];
  for (const browserRoot of browserRoots) {
    let entries = [];
    try {
      entries = await fs.readdir(browserRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith('chromium')) continue;
      const browserDir = path.join(browserRoot, entry.name);
      candidates.push(
        path.join(browserDir, 'chrome-linux', 'chrome'),
        path.join(browserDir, 'chrome-linux', 'headless_shell'),
        path.join(browserDir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
        path.join(browserDir, 'chrome-win', 'chrome.exe'),
      );
    }
  }
  return candidates;
}

async function findInPath(command) {
  const pathEntries = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const extensions = process.platform === 'win32' ? ['.exe', '.cmd', '.bat', ''] : [''];
  for (const pathEntry of pathEntries) {
    for (const extension of extensions) {
      const candidate = path.join(pathEntry, `${command}${extension}`);
      if (await isExecutable(candidate)) return candidate;
    }
  }
  return null;
}

async function isExecutable(filePath) {
  try {
    await fs.access(filePath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function waitForWebSocketEndpoint(port, chromeLogs = []) {
  const listUrl = `http://127.0.0.1:${port}/json/list`;
  const versionUrl = `http://127.0.0.1:${port}/json/version`;
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const pages = await fetch(listUrl).then((res) => res.json());
      const page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;

      const data = await fetch(versionUrl).then((res) => res.json());
      if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
    } catch {
      await sleep(200);
    }
  }
  const logText = chromeLogs.join('').trim();
  throw new Error(`Timed out waiting for Chrome remote debugging endpoint.${logText ? `\n\nChrome output:\n${logText}` : ''}`);
}

function connectCdp(endpoint) {
  const ws = new WebSocket(endpoint);
  let id = 0;
  const callbacks = new Map();
  const events = new Map();
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && callbacks.has(message.id)) {
      const { resolve, reject } = callbacks.get(message.id);
      callbacks.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result || {});
      return;
    }
    const listeners = events.get(message.method) || [];
    listeners.forEach((listener) => listener(message.params || {}));
  });

  return {
    async send(method, params = {}) {
      await ready;
      return new Promise((resolve, reject) => {
        const messageId = ++id;
        callbacks.set(messageId, { resolve, reject });
        ws.send(JSON.stringify({ id: messageId, method, params }));
      });
    },
    once(method) {
      return new Promise((resolve) => {
        const listener = (params) => {
          events.set(method, (events.get(method) || []).filter((item) => item !== listener));
          resolve(params);
        };
        events.set(method, [...(events.get(method) || []), listener]);
      });
    },
  };
}

async function navigate(browser, url) {
  const loaded = browser.once('Page.loadEventFired');
  await browser.send('Page.navigate', { url });
  await loaded;
}

async function reload(browser) {
  const loaded = browser.once('Page.loadEventFired');
  await browser.send('Page.reload', { ignoreCache: true });
  await loaded;
}

async function waitForSelector(browser, selector) {
  const expression = `
    new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
          clearInterval(timer);
          resolve(true);
        }
        if (Date.now() - started > 15000) {
          clearInterval(timer);
          reject(new Error('Selector not ready: ${selector}'));
        }
      }, 100);
    })
  `;
  await browser.send('Runtime.evaluate', { expression, awaitPromise: true });
}

async function waitForExportBlocks(browser, expectedCount) {
  const expression = `
    new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        const count = document.querySelectorAll('[data-export-block="true"]').length;
        if (count >= ${JSON.stringify(expectedCount)}) {
          clearInterval(timer);
          resolve(count);
        }
        if (Date.now() - started > 15000) {
          clearInterval(timer);
          reject(new Error('Export blocks not ready'));
        }
      }, 100);
    })
  `;
  await browser.send('Runtime.evaluate', { expression, awaitPromise: true });
}

async function openPreview(browser) {
  await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const previewButton = buttons.find((button) => button.textContent.includes('预览'));
      if (previewButton) previewButton.click();
      return Boolean(previewButton);
    })()`,
    returnByValue: true,
  });
}

async function waitForFonts(browser) {
  await browser.send('Runtime.evaluate', {
    expression: 'document.fonts ? document.fonts.ready.then(() => true) : true',
    awaitPromise: true,
  });
  await sleep(500);
}

async function getElementRect(browser, selector) {
  const result = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      };
    })()`,
    returnByValue: true,
  });
  const rect = result.result.value;
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    throw new Error(`Invalid export rectangle for ${selector}.`);
  }
  return rect;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
