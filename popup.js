const $ = (id) => document.getElementById(id);
const recorder = $('recorder'), keysEl = $('keys'), hint = $('hint');
let recording = false;
const DEFAULT_HINT = 'Click the box, then press your keys';

function render(s) {
  keysEl.innerHTML = '';
  if (!s) {
    keysEl.innerHTML = '<span class="placeholder">Not set</span>';
    return;
  }
  const parts = [];
  if (s.ctrl) parts.push('Ctrl');
  if (s.alt) parts.push('Alt');
  if (s.shift) parts.push('Shift');
  if (s.meta) parts.push('Meta');
  parts.push(s.display);
  parts.forEach((p, i) => {
    if (i) { const plus = document.createElement('span'); plus.className = 'plus'; plus.textContent = '+'; keysEl.appendChild(plus); }
    const k = document.createElement('kbd'); k.textContent = p; keysEl.appendChild(k);
  });
}

function setHint(text, ok) { hint.textContent = text; hint.classList.toggle('ok', !!ok); }

function setMode(m) {
  document.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
  const manual = m !== 'auto';
  $('shortcutCard').hidden = !manual;
  $('tip').hidden = !manual;
  if (!manual && recording) {
    recording = false;
    recorder.classList.remove('rec');
  }
}
document.querySelectorAll('.seg-btn').forEach((b) => b.addEventListener('click', () => {
  setMode(b.dataset.mode);
  chrome.storage.sync.set({ mode: b.dataset.mode });
}));

chrome.storage.sync.get(['shortcut', 'enabled', 'showToast', 'mode'], (d) => {
  render(d.shortcut);
  $('enabled').checked = d.enabled !== false;
  $('showToast').checked = d.showToast !== false;
  setMode(d.mode === 'auto' ? 'auto' : 'manual');
});
chrome.storage.local.get('skipCount', (d) => { $('count').textContent = d.skipCount || 0; });
chrome.storage.onChanged.addListener((c) => { if (c.skipCount) $('count').textContent = c.skipCount.newValue || 0; });

$('enabled').addEventListener('change', (e) => chrome.storage.sync.set({ enabled: e.target.checked }));
$('showToast').addEventListener('change', (e) => chrome.storage.sync.set({ showToast: e.target.checked }));

recorder.addEventListener('click', () => {
  recording = true;
  recorder.classList.add('rec');
  keysEl.innerHTML = '<span class="placeholder">Press your shortcut…</span>';
  setHint('Listening for keys…');
});

document.addEventListener('keydown', (e) => {
  if (!recording) return;
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
  e.preventDefault();
  if (e.key === 'Escape') {
    recording = false; recorder.classList.remove('rec');
    chrome.storage.sync.get('shortcut', (d) => { render(d.shortcut); setHint(DEFAULT_HINT); });
    return;
  }
  const s = {
    code: e.code,
    display: e.key.length === 1 ? e.key.toUpperCase() : e.key,
    ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey
  };
  chrome.storage.sync.set({ shortcut: s }, () => {
    recording = false;
    recorder.classList.remove('rec');
    render(s);
    setHint('Saved ✓', true);
  });
});

$('clear').addEventListener('click', () => {
  chrome.storage.sync.remove('shortcut', () => { render(null); setHint('Shortcut cleared'); });
});
