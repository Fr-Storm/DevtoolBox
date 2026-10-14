# Dev Toolbox

A local-first workspace of small developer utilities. Everything runs in the browser: no account, no backend, and no external API calls.

## Key features

- Eight working utilities in a single-page layout
- Dark theme by default, with a persisted light/dark toggle (sun/moon icon)
- Sidebar navigation with collapse support, mobile drawer, and Ctrl/Cmd+K tool search
- Favorites stored locally with sidebar icons
- Clipboard helpers with a fallback when the Clipboard API is blocked
- Toast feedback for copy, save, clear, and error states
- Confirmation dialogs for destructive actions
- Accessible: skip links, ARIA labels, focus indicators, reduced-motion support

## Included utilities

1. **JSON Formatter** — format with 2/4-space indent, minify, validate, copy formatted/minified, load sample, clear with confirmation
2. **UUID Generator** — UUID v4 via `crypto.randomUUID()` with `crypto.getRandomValues()` fallback; quantity 1–100, copy individual/all, clear
3. **Base64 Converter** — UTF-8 encode/decode (not naive btoa/atob), swap input/output, example, error messages for malformed input
4. **Timestamp Converter** — Unix seconds/milliseconds ↔ local dates, ISO 8601 UTC output, live current timestamp display, no silent unit guessing
5. **Regex Tester** — JavaScript `RegExp` with g/i/m/s/u flag toggles, live match highlighting using safe DOM nodes (`<mark>`), capture group display, zero-length match safety, sample patterns
6. **JWT Decoder** — local header/payload Base64URL inspection, claims summary with `iss`/`sub`/`aud`/`iat`/`nbf`/`exp`/`jti`, expiry detection, signature display (no verification). Tokens are never stored, logged, or sent anywhere.
7. **Text Diff Checker** — line-level LCS comparison with side-by-side view, line numbers, additions/removals/unchanged count, copy results, size limit guard
8. **Color Palette Generator** — 5 random hex swatches, lock/unlock, manual hex input, copy HEX/RGB, CSS custom properties export, UI preview (card + button), contrast-aware text color

## Technology stack

- HTML5, CSS3, vanilla JavaScript (ES6+)
- Browser APIs: `localStorage`, Clipboard, Web Crypto, `TextEncoder`/`TextDecoder`, `Date`
- No framework, bundler, package manager, or network fonts
- System font stacks and inline SVG icons

## Project structure

```
DevtoolBox/
├── index.html       Main page: sidebar, header, workspace, tools, modals
├── style.css        Design tokens, layout, components, responsive, themes
├── core.js          Shared utilities: storage, clipboard, toast, encoding, diff, color math
├── app.js           Navigation, tool wiring, event binding, tool-specific logic
├── README.md        This file
└── .gitignore       Editor and OS artifacts
```

`core.js` holds shared helpers (storage, clipboard, encoding, diff, color math).
`app.js` wires navigation and each tool's UI logic.

## How to run locally

Open `index.html` in a modern browser, or serve the folder:

```bash
python3 -m http.server 8765
```

Then visit `http://localhost:8765`.

A static server is optional. The app uses classic `<script>` tags so it can also run from the filesystem.

## Browser compatibility

Tested against current Chromium-based browsers. Expect it to work in recent Firefox and Safari as well.

Notes:

- `crypto.randomUUID()` is preferred; `crypto.getRandomValues()` is the UUID fallback
- The Clipboard API often requires a secure context (`https` or `localhost`). From `file://`, the app tries `document.execCommand("copy")`
- `TextDecoder` with `{ fatal: true }` is used so invalid UTF-8 is reported instead of silently corrupted
- Base64 encoding uses `TextEncoder` for proper UTF-8 handling rather than naive `btoa()`

## Privacy

All processing happens on the device.

LocalStorage may hold:

- Theme preference
- Sidebar collapsed state
- Last selected tool
- Favorite tool IDs

JWT input, passwords, and arbitrary editor contents are **not** written to LocalStorage. Tokens are never sent to a server and are not logged to the console.

## Known limitations

- JSON editing is a textarea, not a full code editor
- JWT decoding does **not** verify signatures or prove authenticity
- Regex uses the JavaScript engine only (not PCRE/Python)
- Diff is line-based LCS with size limits (~120K chars, ~1200 lines) to avoid freezing the tab
- Palettes are random; they are not claimed to be harmonic unless a harmony algorithm is added later
- There is no offline package of extra fonts or icons beyond system fonts and inline SVG
