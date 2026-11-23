# YT Skip Shortcut

A Chrome extension that skips YouTube ads for you, either **automatically** or with **your own keyboard shortcut**. It only works on ads that have a Skip button. It does not block ads.

**Version:** 2.2.0 | **Manifest:** V3 | **Works on:** `youtube.com`, `m.youtube.com`

---

## Features

- **Manual mode:** press the shortcut you chose to skip the ad.
- **Auto mode:** the extension clicks Skip as soon as the button appears.
- **Your own shortcut:** record any key combination from the popup, such as `Alt+Q` or `Shift+S`.
- **Step-by-step messages:** small on-screen messages just above the player's control bar (also in fullscreen) tell you what is happening.
- **Skip counter:** the popup shows how many ads have been skipped.
- **On/off switch:** pause the extension without removing it.
- **Light and dark popup:** follows your system theme.

---

## Installation

1. Download and unzip `yt-skip-shortcut.zip`.
2. Open `chrome://extensions` in Chrome (or any Chromium browser such as Edge or Brave).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `yt-skip-shortcut` folder.
5. Click the puzzle icon in the toolbar and pin **YT Skip Shortcut**.
6. **Refresh any YouTube tab that was already open.**

### Updating

1. Replace the old folder with the new one.
2. Go to `chrome://extensions` and click the **reload** icon on the extension.
3. Refresh your YouTube tabs.

---

## How to use

Click the extension icon to open the popup.

### Skip mode

| Mode | What happens |
|------|--------------|
| **Manual** | The ad is skipped only when you press your shortcut. |
| **Auto** | The extension skips the ad by itself when the Skip button appears. |

### Setting your shortcut (Manual mode)

1. Choose **Manual**.
2. Click the shortcut box.
3. Press your key combination. It saves automatically ("Saved ✓").
4. Press **Esc** while recording to cancel, or **Clear** to remove the shortcut.

Tips:
- Use Ctrl, Alt or Shift with a key. A plain single key is ignored while you type in search or comments.
- Chrome keeps some shortcuts for itself (Ctrl+T, Ctrl+W, Ctrl+Tab and similar). The extension cannot use these.
- The shortcut is saved by physical key position, so it works the same on any keyboard layout.
- In **Auto** mode the shortcut box is hidden and the shortcut is switched off.

### Other settings

| Setting | Default | Description |
|---------|---------|-------------|
| Enable switch (top right) | On | Turns the whole extension on or off. |
| Show messages | On | Shows or hides the on-screen messages. |
| Real-click fallback | Off | Last-resort real mouse click. Chrome shows a "debugging this browser" bar while it runs. |

---

## On-screen messages

Messages appear in the middle of the video, just above the control bar.

| Message | Meaning |
|---------|---------|
| ℹ️ Ad detected | An ad started. It also says which mode is on. |
| ⏭️ Skip ready – press `<your shortcut>` | The Skip button is visible (Manual mode). |
| ⏭️ Skip button ready | The Skip button is visible (Auto mode). |
| ⏳ Skipping ad… | A skip attempt is running. |
| ⏳ Trying another method… | The normal click did not work, so the next step is running. |
| ⏳ Retrying with a real click… | Only if Real-click fallback is on. |
| ✅ Ad skipped | The ad was skipped and the counter went up. |
| ❌ Could not skip this ad | All steps failed. Auto mode retries up to 3 times. |
| ⚠️ Not ready yet – wait for the Skip button | You pressed the shortcut before the Skip button appeared. |
| ℹ️ No ad playing right now | You pressed the shortcut when no ad was playing. |
| ℹ️ Ad finished – video resumed | The ad ended and your video continues. |

---

## How skipping works

When a skippable ad is playing, the extension tries these steps in order and stops at the first one that works:

1. **Click the Skip button** using a full set of mouse and pointer events.
2. **Finish the ad in the player** by moving the ad video to its end. This is only done while the Skip button is visible, and it shows no Chrome banner.
3. **Real mouse click** through Chrome's debugger interface. This runs only if **Real-click fallback** is ticked.

Ads with no Skip button (unskippable ads) are left alone.

---

## Permissions

| Permission | Why it is needed |
|------------|------------------|
| `storage` | Saves your shortcut, mode, settings and the skip counter. |
| `debugger` | Used only by the optional real-click fallback. Chrome shows its "debugging this browser" bar whenever this is used. It is never used unless you tick the option. |
| Access to `youtube.com` | Lets the extension find the Skip button and show messages on the page. |

No data leaves your browser. The extension makes no network requests and has no analytics.

---

## Project structure

```
yt-skip-shortcut/
├── manifest.json     Extension settings and permissions
├── content.js        Runs on YouTube: ad detection, skipping, shortcut, messages
├── background.js     Performs the optional real mouse click
├── popup.html        Popup layout
├── popup.css         Popup styling (light and dark)
├── popup.js          Popup logic: mode, shortcut recorder, settings, counter
├── icon16.png        Icons
├── icon32.png
├── icon48.png
├── icon128.png
└── README.md
```

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| Nothing happens | Reload the extension in `chrome://extensions`, then refresh the YouTube tab. Check that the top-right switch is on. |
| Shortcut does nothing | Make sure **Manual** mode is selected and a shortcut is set. Try a different combination such as `Alt+Q`, because Chrome may use yours. |
| "Not ready yet" appears | Wait until the Skip button shows on the ad, then press the shortcut. It usually appears after about 5 seconds. |
| Ad stays after "Skipping ad…" | Tick **Real-click fallback** in the popup. Chrome will show its debugging bar while it runs. |
| No messages appear | Tick **Show messages** in the popup and refresh the YouTube tab. |
| Browser is zoomed | The real-click fallback is most accurate at 100% zoom. |
| Stopped working after a while | YouTube may have renamed its Skip button. Update the `SKIP_SELECTORS` list at the top of `content.js`. |

---

## Limitations

- It only skips ads that show a Skip button. Unskippable ads cannot be skipped.
- YouTube changes its page often, so selectors may need updating from time to time.
- Chrome's "debugging this browser" bar cannot be hidden by an extension. That is why the real-click fallback is optional and off by default.
- The extension runs on the main YouTube pages only, not on embedded players on other sites.

---

## Version history

| Version | Changes |
|---------|---------|
| 2.2.0 | Real-click fallback made optional. Added the "finish ad in player" step. |
| 2.1.2 | Messages now sit just above the player control bar. |
| 2.1.1 | Shortcut box hidden in Auto mode. |
| 2.1.0 | Added Auto and Manual modes and step-by-step messages. |
| 2.0.x | New popup design, skip counter, confirmation messages, icons. |
| 1.x | First versions with the shortcut recorder and click fixes. |