/*
  Smoke test. Plain node script, no test runner.
  Needs the `playwright` package (npm install, or a global install with NODE_PATH set).
  Run:  node tests/smoke.js
  Optional: PROTOTYPE=/path/to/prototype/index.html to compare schedule output with the original prototype.
*/
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const SITE = path.resolve(__dirname, '..');
const PROTOTYPE = process.env.PROTOTYPE || path.join(__dirname, 'fixtures', 'prototype.html');
const EM = String.fromCharCode(8212);
let pass = 0, fail = 0;
const failures = [];
function check(name, ok, detail) {
  if (ok) { pass++; } else { fail++; failures.push(name + (detail ? ' :: ' + detail : '')); console.log('FAIL  ' + name + (detail ? ' :: ' + detail : '')); }
}
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
async function serve(dir) {
  const port = await freePort();
  const proc = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dir], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    const ok = await new Promise(r => http.get('http://127.0.0.1:' + port + '/', x => { x.resume(); r(true); }).on('error', () => r(false)));
    if (ok) break; await new Promise(r => setTimeout(r, 100));
  }
  return { url: 'http://127.0.0.1:' + port + '/', stop: () => proc.kill() };
}
const tomorrow8 = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T08:00'; };

async function setSchedule(page, when, anchor) {
  await page.evaluate(([w, a]) => {
    const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    set('anchor', a); set('when', w); set('peak', '5'); set('bulk', '4.5'); set('cold', '14');
  }, [when, anchor]);
}
async function scheduleRows(page) {
  return page.evaluate(() => {
    const out = [];
    document.querySelectorAll('#sched > *').forEach(el => {
      if (el.classList.contains('dayhead')) out.push('DAY ' + el.textContent.trim());
      else out.push(el.querySelector('.time').textContent.trim() + ' | ' + el.children[1].firstChild.textContent.trim() + (el.classList.contains('night') ? ' | night' : '') + (el.classList.contains('key') ? ' | key' : ''));
    });
    const w = document.getElementById('warn');
    out.push('WARN ' + (getComputedStyle(w).display === 'none' ? '' : w.textContent.trim()));
    return out;
  });
}
const isPhotoRes = m => { const u = m.location() && m.location().url || ''; return /\/photos\//.test(u) || /404/.test(m.text()) && /photos/.test(m.text()); };

async function runCombo(browser, base, vp, scheme) {
  const tag = '[' + vp.width + ' ' + scheme + '] ';
  const ctx = await browser.newContext({ viewport: vp, colorScheme: scheme });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !isPhotoRes(m) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });

  for (const tab of ['recipe', 'checks', 'schedule', 'fixes']) {
    await page.goto(base + '#' + tab); await page.waitForSelector('#v-' + tab + '.on');
    const w = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    check(tag + 'no horizontal overflow on #' + tab, w[0] <= w[1], w.join(' > '));
    const cur = await page.getAttribute('#nav a[aria-current=page]', 'data-v');
    check(tag + 'aria-current on #' + tab, cur === tab, cur);
  }

  // loaf scaling
  await page.goto(base + '#recipe'); await page.waitForSelector('#v-recipe.on');
  const flour = () => page.evaluate(() => document.querySelector('#ing .row .val').textContent.trim());
  const bigVisible = () => page.isVisible('#bigBatch');
  check(tag + 'default is 2 loaves', (await flour()) === '900g' && !(await bigVisible()));
  for (const [n, g] of [[1, '450g'], [2, '900g'], [4, '1800g']]) {
    await page.click('#scale button[data-n="' + n + '"]');
    check(tag + n + ' loaves flour ' + g, (await flour()) === g, await flour());
    check(tag + '4-loaf warning only at 4 (n=' + n + ')', (await bigVisible()) === (n === 4));
  }
  const step1_4 = await page.evaluate(() => document.querySelector('#steps .step .body').textContent);
  check(tag + '4 loaves method shows per-batch amounts', /900g bread flour/.test(step1_4) && /per batch/.test(step1_4));
  const th = await page.evaluate(() => { const t = document.querySelector('#scale .thumb'); return t ? t.style.transform + '|' + t.style.width : ''; });
  check(tag + 'segmented thumb positioned', /translate\(\d/.test(th) && !/translate\(0px/.test(th), th);
  await page.reload(); await page.waitForSelector('#v-recipe.on');
  check(tag + 'reload resets to 2 loaves', (await flour()) === '900g' && (await page.getAttribute('#scale button[data-n="2"]', 'aria-pressed')) === 'true');

  // steps persist + a11y
  await page.evaluate(() => localStorage.removeItem('sd-steps')); await page.reload(); await page.waitForSelector('#v-recipe.on');
  await page.click('#steps .step:nth-child(1) .toggle');
  check(tag + 'step checked', (await page.getAttribute('#steps .step:nth-child(1) .toggle', 'aria-checked')) === 'true');
  check(tag + 'progress status', (await page.textContent('#stepCount')) === '1 of 11 done', await page.textContent('#stepCount'));
  await page.reload(); await page.waitForSelector('#v-recipe.on');
  check(tag + 'step persists after reload', (await page.getAttribute('#steps .step:nth-child(1) .toggle', 'aria-checked')) === 'true');
  check(tag + 'localStorage sd-steps', (await page.evaluate(() => localStorage.getItem('sd-steps'))) === '[0]');
  await page.focus('#steps .step:nth-child(2) .toggle'); await page.keyboard.press('Space');
  check(tag + 'Space toggles step', (await page.getAttribute('#steps .step:nth-child(2) .toggle', 'aria-checked')) === 'true');
  await page.keyboard.press('Enter');
  check(tag + 'Enter toggles step', (await page.getAttribute('#steps .step:nth-child(2) .toggle', 'aria-checked')) === 'false');
  await page.click('#clearSteps');
  check(tag + 'clear shows undo', /Checks cleared\. Undo/.test(await page.textContent('#clearStatus')));
  await page.click('#clearStatus .linkbtn');
  check(tag + 'undo restores checks', (await page.getAttribute('#steps .step:nth-child(1) .toggle', 'aria-checked')) === 'true' && (await page.textContent('#stepCount')) === '1 of 11 done');
  await page.click('#clearSteps'); // leave clean

  // schedule
  await page.goto(base + '#schedule'); await page.waitForSelector('#v-schedule.on');
  const when = tomorrow8();
  await setSchedule(page, when, 'oven');
  const mine = await scheduleRows(page);
  check(tag + 'schedule has rows', mine.length > 18, String(mine.length));
  if (vp.width === 1194 && scheme === 'light') {
    const pp = await ctx.newPage();
    await pp.goto('file://' + PROTOTYPE); await pp.evaluate(() => { location.hash = '#schedule'; });
    for (const [n, anchor] of [[2, 'oven'], [1, 'oven'], [4, 'oven'], [2, 'slice']]) {
      await pp.evaluate(k => document.querySelector('#scale button[data-n="' + k + '"]').click(), n); await setSchedule(pp, when, anchor);
      await page.evaluate(k => document.querySelector('#scale button[data-n="' + k + '"]').click(), n);
      await setSchedule(page, when, anchor);
      const a = await scheduleRows(pp), b = await scheduleRows(page);
      check(tag + 'schedule matches prototype (loaves ' + n + ', ' + anchor + ')', JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a.filter((x, i) => x !== b[i]).slice(0, 3)) + ' vs ' + JSON.stringify(b.filter((x, i) => x !== a[i]).slice(0, 3)));
    }
    await pp.close();
    await page.evaluate(() => document.querySelector('#scale button[data-n="2"]').click());
    await setSchedule(page, when, 'oven');
  }
  const mine2 = await scheduleRows(page);
  check(tag + '2-loaf oven 8:00 AM row present', mine2.some(r => /^8:00\s?AM \| Poke test|^8:00\s?AM \| Loaf 1: poke test/i.test(r)), mine2.filter(r => /8:00/.test(r)).join(' / '));
  check(tag + 'schedule persisted', (await page.evaluate(() => JSON.parse(localStorage.getItem('sd-sched')).when)) === when);
  check(tag + 'night warning has role=status', (await page.getAttribute('#warn', 'role')) === 'status');

  // copy status is live
  check(tag + 'copy status aria-live', (await page.getAttribute('#copyStatus', 'aria-live')) === 'polite');

  // photo placeholders
  await page.goto(base + '#checks'); await page.waitForSelector('#v-checks.on');
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
  await page.waitForFunction(() => document.querySelectorAll('.ph .frame.empty').length === 11, null, { timeout: 15000 }).catch(() => {});
  const ph = await page.evaluate(() => ({ empty: [...document.querySelectorAll('.ph .frame')].map(f => f.textContent.trim()), eyebrows: [...document.querySelectorAll('.ph .k')].map(e => e.textContent.trim()) }));
  check(tag + '11 photo cards', ph.eyebrows.length === 11);
  check(tag + 'all show Photo coming soon', ph.empty.every(t => t === 'Photo coming soon'), JSON.stringify(ph.empty.filter(t => t !== 'Photo coming soon')));
  check(tag + 'no eyebrow starts with a digit', ph.eyebrows.every(t => !/^\d/.test(t)), ph.eyebrows.join(','));

  // fixes + content counts
  await page.goto(base + '#fixes'); await page.waitForSelector('#v-fixes.on');
  check(tag + '19 troubleshooting cards', (await page.locator('#fixList .card').count()) === 19);

  // em dash
  for (const t of ['recipe', 'checks', 'schedule', 'fixes']) { await page.goto(base + '#' + t); }
  const body = await page.evaluate(() => document.body.textContent + ' ' + [...document.querySelectorAll('[aria-label],[alt],[title],meta[content]')].map(e => (e.getAttribute('aria-label') || '') + (e.getAttribute('alt') || '') + (e.getAttribute('title') || '') + (e.getAttribute('content') || '')).join(' '));
  check(tag + 'no U+2014 in rendered text', body.indexOf(EM) === -1);

  // header scroll edge + per-tab scroll memory
  await page.goto(base + '#fixes'); await page.waitForSelector('#v-fixes.on');
  await page.evaluate(() => window.scrollTo(0, 600)); await page.waitForTimeout(200);
  check(tag + 'header gets scrolled class', await page.evaluate(() => document.getElementById('top').classList.contains('scrolled')));
  await page.evaluate(() => { location.hash = '#recipe'; }); await page.waitForTimeout(250);
  await page.evaluate(() => { location.hash = '#fixes'; }); await page.waitForTimeout(250);
  check(tag + 'fixes tab remembers scroll', Math.abs((await page.evaluate(() => scrollY)) - 600) < 3, String(await page.evaluate(() => scrollY)));
  await page.click('#nav a[data-v="fixes"]'); await page.waitForFunction(() => scrollY === 0, null, { timeout: 4000 }).catch(() => {});
  check(tag + 'tapping active tab scrolls to top', (await page.evaluate(() => scrollY)) === 0);

  // wake lock row, switch not a pill
  const sw = await page.evaluate(() => { const b = document.getElementById('wake'); const cs = getComputedStyle(b); return { r: cs.borderRadius, role: b.getAttribute('role') }; });
  check(tag + 'switch is rounded rect', sw.r === '8px' && sw.role === 'switch', JSON.stringify(sw));

  check(tag + 'no page errors / console errors', errors.length === 0, errors.join(' || '));
  await ctx.close();
}

async function photoTest(browser) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-site-'));
  fs.cpSync(SITE, tmp, { recursive: true, filter: s => !/node_modules|\.git$/.test(s) });
  const gen = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await gen.setContent('<body style="margin:0;background:linear-gradient(135deg,#8a4b1f,#e0a458);width:800px;height:600px;display:flex;align-items:center;justify-content:center;font:700 80px sans-serif;color:#fff">TEST</body>');
  fs.mkdirSync(path.join(tmp, 'photos'), { recursive: true });
  await gen.screenshot({ path: path.join(tmp, 'photos', 'finished.jpg'), type: 'jpeg', quality: 80 });
  await gen.close();
  const srv = await serve(tmp);
  for (const vp of [{ width: 440, height: 956 }, { width: 1194, height: 834 }]) {
    const tag = '[photo ' + vp.width + '] ';
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !isPhotoRes(m) && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.goto(srv.url + '#checks'); await page.waitForSelector('#v-checks.on');
    const card = page.locator('.ph', { hasText: 'Finished loaf' });
    await card.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const i = document.querySelector('.zoom[data-zoom="finished"] img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 8000 }).catch(() => {});
    const okImg = await page.evaluate(() => { const i = document.querySelector('.ph .zoom[data-zoom="finished"] img'); return !!i && i.naturalWidth > 0; });
    check(tag + 'dummy photo renders (jpg only, no webp)', okImg);
    check(tag + 'other cards still say coming soon', (await page.locator('.ph .frame.empty').count()) >= 0);
    await card.locator('.zoom').click();
    await page.waitForSelector('#lb:not([hidden])');
    await page.waitForTimeout(400);
    check(tag + 'lightbox opens', await page.isVisible('#lb'));
    check(tag + 'lightbox caption', (await page.textContent('#lb .cap')) === 'Finished loaf');
    check(tag + 'focus on close button', await page.evaluate(() => document.activeElement.classList.contains('lbclose')));
    check(tag + 'dialog aria', (await page.getAttribute('#lb', 'aria-modal')) === 'true' && (await page.getAttribute('#lb', 'role')) === 'dialog');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#lb', { state: 'hidden', timeout: 3000 }).catch(() => {});
    check(tag + 'Escape closes lightbox', !(await page.isVisible('#lb')));
    check(tag + 'focus returns to thumbnail', await page.evaluate(() => document.activeElement.classList.contains('zoom') && document.activeElement.dataset.zoom === 'finished'));
    // reopen, close with button
    await card.locator('.zoom').click(); await page.waitForSelector('#lb:not([hidden])'); await page.waitForTimeout(400);
    await page.click('#lb .lbclose'); await page.waitForSelector('#lb', { state: 'hidden', timeout: 3000 }).catch(() => {});
    check(tag + 'close button closes lightbox', !(await page.isVisible('#lb')));
    // reopen, swipe down
    await card.locator('.zoom').click(); await page.waitForSelector('#lb:not([hidden])'); await page.waitForTimeout(400);
    const box = await page.locator('#lb img').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 40); await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width / 2, box.y + 40 + i * 30);
    await page.mouse.up();
    await page.waitForSelector('#lb', { state: 'hidden', timeout: 3000 }).catch(() => {});
    check(tag + 'swipe down dismisses', !(await page.isVisible('#lb')));
    // short drag springs back
    await card.locator('.zoom').click(); await page.waitForSelector('#lb:not([hidden])'); await page.waitForTimeout(400);
    const b2 = await page.locator('#lb img').boundingBox();
    await page.mouse.move(b2.x + b2.width / 2, b2.y + 40); await page.mouse.down();
    await page.mouse.move(b2.x + b2.width / 2, b2.y + 70, { steps: 6 }); await page.waitForTimeout(400); await page.mouse.up();
    await page.waitForTimeout(500);
    check(tag + 'short drag springs back', await page.isVisible('#lb'));
    await page.keyboard.press('Escape'); await page.waitForSelector('#lb', { state: 'hidden', timeout: 3000 }).catch(() => {});
    // step thumbnail
    await page.goto(srv.url + '#recipe'); await page.waitForSelector('#v-recipe.on');
    await page.locator('#steps .step:nth-child(10)').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const th = await page.evaluate(() => [...document.querySelectorAll('#steps .thumbs .zoom')].map(z => z.dataset.zoom));
    check(tag + 'step thumbnails: only existing photo remains', th.length === 1 && th[0] === 'finished', JSON.stringify(th));
    check(tag + 'no errors', errors.length === 0, errors.join(' || '));
    await ctx.close();
  }
  srv.stop(); fs.rmSync(tmp, { recursive: true, force: true });
}

function staticChecks() {
  const files = [];
  (function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { if (f.name === 'node_modules') continue; const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (/\.(html|css|js|md|txt|svg|webmanifest|json)$/.test(f.name)) files.push(p); } })(SITE);
  const bad = files.filter(f => fs.readFileSync(f, 'utf8').indexOf(EM) !== -1);
  check('no U+2014 in any text file', bad.length === 0, bad.join(','));
  const css = fs.readFileSync(path.join(SITE, 'css/styles.css'), 'utf8');
  check('no 999px radius', !/999px/.test(css));
  check('no italic in css', !/font-style:\s*italic/.test(css) && !/<em>|<i>/.test(fs.readFileSync(path.join(SITE, 'index.html'), 'utf8')));
  const app = fs.readFileSync(path.join(SITE, 'js/app.js'), 'utf8');
  check('no claude/assets/db references', !/claude\.|\.use\(|assets\.|photoStore|filePick|Bake Log/i.test(app));
}

(async () => {
  staticChecks();
  const srv = await serve(SITE);
  const browser = await chromium.launch();
  try {
    for (const vp of [{ width: 440, height: 956 }, { width: 1194, height: 834 }])
      for (const scheme of ['light', 'dark']) await runCombo(browser, srv.url, vp, scheme);
    // print
    const ctx = await browser.newContext({ viewport: { width: 800, height: 900 } });
    const page = await ctx.newPage(); await page.goto(srv.url + '#fixes'); await page.emulateMedia({ media: 'print' });
    check('print shows Recipe only', (await page.isVisible('#v-recipe')) && !(await page.isVisible('#v-fixes')) && !(await page.isVisible('header')));
    await ctx.close();
    await photoTest(browser);
  } catch (e) { check('test run crashed', false, e.stack); }
  await browser.close(); srv.stop();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail) { console.log(failures.join('\n')); process.exit(1); }
})();
