"use strict";

var DT = window.DT || {};
window.DT = DT;

DT.VERSION = "1.0.0";
DT.STORAGE_KEYS = {
  theme: "devtoolbox.theme",
  sidebar: "devtoolbox.sidebarCollapsed",
  lastTool: "devtoolbox.lastTool",
  favorites: "devtoolbox.favorites"
};

DT.readStore = function (key) {
  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    return null;
  }
};

DT.writeStore = function (key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    return false;
  }
};

DT.removeStore = function (key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    return false;
  }
};

DT.parseJsonSafe = function (raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
};

DT.escapeText = function (value) {
  return String(value == null ? "" : value);
};

DT.textContent = function (el, value) {
  if (el) el.textContent = DT.escapeText(value);
};

var toastTimer = null;
var lastToast = { message: "", at: 0 };

DT.toast = function (message, type) {
  var box = document.getElementById("toasts");
  if (!box) return;
  var now = Date.now();
  if (lastToast.message === message && now - lastToast.at < 900) {
    lastToast.at = now;
    return;
  }
  lastToast = { message: message, at: now };
  box.textContent = "";
  var el = document.createElement("div");
  el.className = "toast " + (type || "info");
  el.textContent = message;
  box.appendChild(el);
  if (type === "error") {
    var live = document.getElementById("assertive");
    if (live) live.textContent = message;
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, type === "error" ? 5200 : 2600);
};

DT.copyText = function (text) {
  var value = String(text == null ? "" : text);
  if (!value) {
    DT.toast("Nothing to copy.", "error");
    return Promise.resolve(false);
  }
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    return navigator.clipboard.writeText(value).then(function () {
      DT.toast("Copied to clipboard.", "success");
      return true;
    }).catch(function () {
      return DT.copyFallback(value);
    });
  }
  return Promise.resolve(DT.copyFallback(value));
};

DT.copyFallback = function (value) {
  var ta = document.createElement("textarea");
  ta.value = value;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  var ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (err) {
    ok = false;
  }
  document.body.removeChild(ta);
  if (ok) DT.toast("Copied to clipboard.", "success");
  else DT.toast("Copy failed. Select the text and copy it manually.", "error");
  return ok;
};

DT.confirm = function (message) {
  return new Promise(function (resolve) {
    var overlay = document.getElementById("confirm-overlay");
    var body = document.getElementById("confirm-body");
    var ok = document.getElementById("confirm-ok");
    var cancel = document.getElementById("confirm-cancel");
    if (!overlay || !ok || !cancel) {
      resolve(window.confirm(message));
      return;
    }
    body.textContent = message;
    overlay.hidden = false;
    ok.focus();
    function done(result) {
      overlay.hidden = true;
      ok.removeEventListener("click", onOk);
      cancel.removeEventListener("click", onCancel);
      overlay.removeEventListener("click", onBackdrop);
      document.removeEventListener("keydown", onKey);
      resolve(result);
    }
    function onOk() { done(true); }
    function onCancel() { done(false); }
    function onBackdrop(ev) { if (ev.target === overlay) done(false); }
    function onKey(ev) {
      if (ev.key === "Escape") done(false);
      if (ev.key === "Enter") done(true);
    }
    ok.addEventListener("click", onOk);
    cancel.addEventListener("click", onCancel);
    overlay.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onKey);
  });
};

DT.getTheme = function () {
  var saved = DT.readStore(DT.STORAGE_KEYS.theme);
  if (saved === "dark" || saved === "light") return saved;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
};

DT.applyTheme = function (theme, persist) {
  var next = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  var btn = document.getElementById("theme-toggle");
  if (btn) btn.setAttribute("aria-label", next === "dark" ? "Switch to light theme" : "Switch to dark theme");
  if (persist) DT.writeStore(DT.STORAGE_KEYS.theme, next);
};

DT.encodeUtf8Base64 = function (text) {
  var bytes = new TextEncoder().encode(text);
  var chunk = 0x8000;
  var binary = "";
  for (var i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

DT.decodeBase64Utf8 = function (input) {
  var cleaned = String(input).replace(/\s+/g, "");
  if (!cleaned) throw new Error("Input is empty.");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) {
    throw new Error("Not valid Base64. Use A–Z, a–z, 0–9, +, / and optional = padding.");
  }
  if (cleaned.length % 4 === 1) {
    throw new Error("Malformed Base64: length is invalid.");
  }
  var binary;
  try {
    binary = atob(cleaned);
  } catch (err) {
    throw new Error("Malformed Base64. Check padding and characters.");
  }
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (err) {
    throw new Error("Decoded bytes are not valid UTF-8.");
  }
};

DT.decodeBase64UrlUtf8 = function (input) {
  var cleaned = String(input).replace(/\s+/g, "");
  if (!cleaned) throw new Error("Empty Base64URL segment.");
  if (!/^[A-Za-z0-9_-]+$/.test(cleaned)) {
    throw new Error("Segment is not valid Base64URL.");
  }
  var b64 = cleaned.replace(/-/g, "+").replace(/_/g, "/");
  var pad = b64.length % 4;
  if (pad === 1) throw new Error("Truncated Base64URL segment.");
  if (pad) b64 += "=".repeat(4 - pad);
  var binary;
  try {
    binary = atob(b64);
  } catch (err) {
    throw new Error("Could not decode Base64URL segment.");
  }
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (err) {
    throw new Error("Segment is not valid UTF-8.");
  }
};

DT.bytesToUuid = function (bytes) {
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  var hex = "";
  for (var i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
};

DT.generateUuidV4 = function () {
  if (!window.crypto) {
    throw new Error("Secure randomness is unavailable in this browser, so a UUID was not generated.");
  }
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  if (typeof crypto.getRandomValues !== "function") {
    throw new Error("Secure randomness is unavailable. Math.random() is not used as a fallback.");
  }
  var bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return DT.bytesToUuid(bytes);
};

DT.splitLines = function (text) {
  if (text === "") return [""];
  return text.split(/\r\n|\n|\r/);
};

DT.lineDiff = function (aText, bText, limits) {
  var maxChars = (limits && limits.maxChars) || 120000;
  var maxLines = (limits && limits.maxLines) || 1200;
  if (aText.length + bText.length > maxChars) {
    throw new Error("Input is too large to compare in the browser (limit " + maxChars + " characters combined). Reduce the text and try again.");
  }
  var a = DT.splitLines(aText);
  var b = DT.splitLines(bText);
  if (a.length > maxLines || b.length > maxLines) {
    throw new Error("Too many lines to compare (limit " + maxLines + " each). Reduce the input.");
  }
  var n = a.length;
  var m = b.length;
  var dp = [];
  var i;
  var j;
  for (i = 0; i <= n; i++) {
    dp[i] = new Uint16Array(m + 1);
  }
  for (i = 1; i <= n; i++) {
    for (j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = dp[i - 1][j] > dp[i][j - 1] ? dp[i - 1][j] : dp[i][j - 1];
    }
  }
  var ops = [];
  i = n;
  j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      ops.push({ type: "same", a: i, b: j, text: a[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ type: "del", a: i, b: 0, text: a[i - 1] });
      i--;
    } else {
      ops.push({ type: "add", a: 0, b: j, text: b[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    ops.push({ type: "del", a: i, b: 0, text: a[i - 1] });
    i--;
  }
  while (j > 0) {
    ops.push({ type: "add", a: 0, b: j, text: b[j - 1] });
    j--;
  }
  ops.reverse();
  return ops;
};

DT.hexToRgb = function (hex) {
  var h = hex.replace("#", "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    hex: "#" + h.toUpperCase()
  };
};

DT.channelToLin = function (c) {
  var s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

DT.relativeLuminance = function (rgb) {
  return 0.2126 * DT.channelToLin(rgb.r) + 0.7152 * DT.channelToLin(rgb.g) + 0.0722 * DT.channelToLin(rgb.b);
};

DT.contrastText = function (hex) {
  var rgb = DT.hexToRgb(hex);
  if (!rgb) return "#F0F2F5";
  var L = DT.relativeLuminance(rgb);
  var contrastWhite = 1.05 / (L + 0.05);
  var contrastBlack = (L + 0.05) / 0.05;
  return contrastWhite >= contrastBlack ? "#F0F2F5" : "#12151A";
};

DT.randomHex = function () {
  if (window.crypto && crypto.getRandomValues) {
    var bytes = new Uint8Array(3);
    crypto.getRandomValues(bytes);
    return "#" + Array.from(bytes).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("").toUpperCase();
  }
  throw new Error("Secure randomness is unavailable for color generation.");
};

DT.formatNumericDate = function (value) {
  if (typeof value !== "number" || !isFinite(value)) return { ok: false, label: "invalid" };
  var ms = value * 1000;
  var d = new Date(ms);
  if (isNaN(d.getTime())) return { ok: false, label: "invalid" };
  return { ok: true, label: d.toISOString() };
};
