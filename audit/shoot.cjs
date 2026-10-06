const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:5173';
const OUT = __dirname;

const DESKTOP = { width: 1440, height: 900, dpr: 1 };
const MOBILE = { width: 390, height: 844, dpr: 2 };

const SECTIONS = ['inicio', 'servicios', 'proyectos', 'proceso', 'nosotros', 'contacto'];

async function withTheme(page, theme) {
  await page.evaluateOnNewDocument((t) => {
    try { window.localStorage.setItem('mdc-theme', t); } catch (e) {}
  }, theme);
}

async function waitForLoad(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
  });
  // allow reveal/transitions to settle
  await new Promise(r => setTimeout(r, 350));
}

async function shoot(browser, viewport, theme, label) {
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: viewport.dpr });
  await withTheme(page, theme);
  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 30000 });
  await waitForLoad(page);
  for (const id of SECTIONS) {
    await page.evaluate((sid) => {
      const el = document.getElementById(sid);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, id);
    await new Promise(r => setTimeout(r, 250));
    const file = path.join(OUT, `${label}-${id}.png`);
    await page.screenshot({ path: file });
    process.stdout.write(`  ${label}-${id}.png (${fs.statSync(file).size} B)\n`);
  }
  // full-page shots
  await page.evaluate(() => window.scrollTo(0, 0));
  const full = path.join(OUT, `${label}-FULL.png`);
  await page.screenshot({ path: full, fullPage: true });
  process.stdout.write(`  ${label}-FULL.png (${fs.statSync(full).size} B)\n`);
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars'],
  });
  console.log('> desktop · dark');
  await shoot(browser, DESKTOP, 'dark', 'dt-dark');
  console.log('> desktop · light');
  await shoot(browser, DESKTOP, 'light', 'dt-light');
  console.log('> mobile · dark');
  await shoot(browser, MOBILE, 'dark', 'mob-dark');
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
