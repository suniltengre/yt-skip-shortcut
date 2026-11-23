// Performs a TRUSTED mouse click (same as a real mouse) using Chrome's debugger API.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'trustedClick' || !sender.tab) return;
  const target = { tabId: sender.tab.id };
  const send = (method, params) =>
    new Promise((res, rej) => chrome.debugger.sendCommand(target, method, params, (r) => {
      chrome.runtime.lastError ? rej(chrome.runtime.lastError.message) : res(r);
    }));

  chrome.debugger.attach(target, '1.3', async () => {
    if (chrome.runtime.lastError) {
      sendResponse({ ok: false, error: chrome.runtime.lastError.message });
      return;
    }
    try {
      const { x, y } = msg;
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
      sendResponse({ ok: true });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    } finally {
      chrome.debugger.detach(target, () => void chrome.runtime.lastError);
    }
  });
  return true; // async response
});
