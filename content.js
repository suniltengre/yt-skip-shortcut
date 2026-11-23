let shortcut = null;
let enabled = true;
let showToast = true;
let mode = 'manual'; // 'manual' | 'auto'

chrome.storage.sync.get(['shortcut', 'enabled', 'showToast', 'mode'], (d) => {
  shortcut = d.shortcut || null;
  enabled = d.enabled !== false;
  showToast = d.showToast !== false;
  mode = d.mode === 'auto' ? 'auto' : 'manual';
});
chrome.storage.onChanged.addListener((c) => {
  if (c.shortcut) shortcut = c.shortcut.newValue || null;
  if (c.enabled) enabled = c.enabled.newValue !== false;
  if (c.showToast) showToast = c.showToast.newValue !== false;
  if (c.mode) mode = c.mode.newValue === 'auto' ? 'auto' : 'manual';
});

/* ---------- helpers ---------- */
const SKIP_SELECTORS = [
  '.ytp-skip-ad-button', '.ytp-ad-skip-button', '.ytp-ad-skip-button-modern',
  '.ytp-ad-skip-button-container', '.ytp-skip-ad', '[class*="skip-button"]', '[id^="skip-button"]'
];

function isVisible(el) {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
}

function findSkipButton() {
  const player = document.querySelector('#movie_player') || document;
  for (const sel of SKIP_SELECTORS) {
    for (const el of player.querySelectorAll(sel)) if (isVisible(el)) return el;
  }
  const areas = player.querySelectorAll('.video-ads, .ytp-ad-module, .ytp-ad-player-overlay, .ytp-ad-player-overlay-layout');
  for (const area of areas) {
    for (const el of area.querySelectorAll('button, [role="button"], div, span')) {
      const t = (el.innerText || el.getAttribute('aria-label') || '').trim().toLowerCase();
      if (t.startsWith('skip') && isVisible(el)) return el.closest('button, [role="button"]') || el;
    }
  }
  return null;
}

function isAdShowing() {
  return !!document.querySelector('.ad-showing');
}

function realClick(el) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const opts = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, button: 0 };
  ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']
    .forEach((type) => el.dispatchEvent(new (type.startsWith('pointer') ? PointerEvent : MouseEvent)(type, opts)));
  try { el.click(); } catch (_) {}
}

function trustedClick(el) {
  return new Promise((resolve) => {
    const r = el.getBoundingClientRect();
    chrome.runtime.sendMessage(
      { type: 'trustedClick', x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) },
      (resp) => resolve(!chrome.runtime.lastError && !!resp && !!resp.ok)
    );
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function countSkip() {
  chrome.storage.local.get('skipCount', (d) => chrome.storage.local.set({ skipCount: (d.skipCount || 0) + 1 }));
}

function shortcutLabel() {
  if (!shortcut) return 'your shortcut';
  const p = [];
  if (shortcut.ctrl) p.push('Ctrl');
  if (shortcut.alt) p.push('Alt');
  if (shortcut.shift) p.push('Shift');
  if (shortcut.meta) p.push('Meta');
  p.push(shortcut.display);
  return p.join('+');
}

/* ---------- on-screen messages ---------- */
const TONES = {
  info:    { bg: '#6366f1', icon: 'ℹ️' },
  ready:   { bg: '#0ea5e9', icon: '⏭️' },
  working: { bg: '#f59e0b', icon: '⏳' },
  success: { bg: '#16a34a', icon: '✅' },
  warn:    { bg: '#ea580c', icon: '⚠️' },
  error:   { bg: '#dc2626', icon: '❌' }
};

function toastBottom(player) {
  // sit just above the YouTube control bar (falls back to a sensible offset when controls are auto-hidden)
  const bar = player.querySelector('.ytp-chrome-bottom');
  const pr = player.getBoundingClientRect();
  let offset = 64;
  if (bar) {
    const br = bar.getBoundingClientRect();
    const fromBottom = pr.bottom - br.top;
    if (br.height > 0 && fromBottom > 20 && fromBottom < pr.height) offset = fromBottom + 10;
  }
  return Math.round(Math.max(64, offset));
}

function toast(text, tone = 'info', ms = 2200) {
  if (!showToast) return;
  const player = document.querySelector('#movie_player');
  const host = player || document.fullscreenElement || document.documentElement;
  const t0 = TONES[tone] || TONES.info;
  let t = document.getElementById('yt-skip-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'yt-skip-toast';
    t.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);z-index:2147483647;' +
      'padding:9px 18px;border-radius:999px;font:600 14px/1.2 system-ui,sans-serif;color:#fff;white-space:nowrap;' +
      'max-width:90%;overflow:hidden;text-overflow:ellipsis;border:1px solid rgba(255,255,255,.35);' +
      'box-shadow:0 6px 22px rgba(0,0,0,.5);pointer-events:none;transition:opacity .25s';
  }
  if (t.parentNode !== host) host.appendChild(t);
  t.style.bottom = (player ? toastBottom(player) : 64) + 'px';
  t.style.background = t0.bg;
  t.textContent = t0.icon + '  ' + text;
  t.style.opacity = '1';
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.style.opacity = '0'; }, ms);
}

/* ---------- skip routine (used by both auto + manual) ---------- */
let skipping = false;

async function performSkip(btn) {
  if (skipping) return false;
  skipping = true;
  try {
    toast('Skipping ad…', 'working', 3000);
    realClick(btn);
    await sleep(250);
    if (!findSkipButton()) { toast('Ad skipped', 'success'); countSkip(); return true; }

    toast('Retrying with a real click…', 'working', 3000);
    await trustedClick(btn);
    await sleep(350);
    if (!findSkipButton()) { toast('Ad skipped', 'success'); countSkip(); return true; }

    toast('Could not skip this ad', 'error');
    return false;
  } finally {
    skipping = false;
  }
}

/* ---------- ad watcher (drives auto mode + step messages) ---------- */
let adActive = false;
let readyNotified = false;
let attempts = 0;
let nextTry = 0;

setInterval(async () => {
  if (!enabled) { adActive = false; return; }
  const ad = isAdShowing();

  if (ad && !adActive) {
    adActive = true; readyNotified = false; attempts = 0; nextTry = 0;
    toast(mode === 'auto' ? 'Ad detected – auto-skip is on' : 'Ad detected – manual mode', 'info');
  } else if (!ad && adActive) {
    adActive = false;
    toast('Ad finished – video resumed', 'info', 1800);
    return;
  }
  if (!adActive || skipping) return;

  const btn = findSkipButton();
  if (!btn) return;

  if (!readyNotified) {
    readyNotified = true;
    toast(mode === 'auto' ? 'Skip button ready' : 'Skip ready – press ' + shortcutLabel(), 'ready', 3000);
  }

  if (mode === 'auto' && attempts < 3 && Date.now() >= nextTry) {
    attempts++;
    const ok = await performSkip(btn);
    if (!ok) nextTry = Date.now() + 1500;
  }
}, 300);

/* ---------- manual shortcut ---------- */
function isTyping(t) {
  if (!t) return false;
  const tag = (t.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
}

function matches(e, s) {
  return e.code === s.code && e.ctrlKey === !!s.ctrl && e.altKey === !!s.alt &&
         e.shiftKey === !!s.shift && e.metaKey === !!s.meta;
}

window.addEventListener('keydown', (e) => {
  if (!enabled || mode !== 'manual' || !shortcut || e.repeat || !matches(e, shortcut)) return;
  if (isTyping(e.target) && !(shortcut.ctrl || shortcut.alt || shortcut.meta)) return;

  const btn = findSkipButton();
  if (btn) {
    e.preventDefault();
    e.stopImmediatePropagation();
    toast('Shortcut pressed', 'info', 1200);
    performSkip(btn);
  } else if (isAdShowing()) {
    e.preventDefault();
    toast('Not ready yet – wait for the Skip button', 'warn');
  } else {
    toast('No ad playing right now', 'info', 1500);
  }
}, true);
