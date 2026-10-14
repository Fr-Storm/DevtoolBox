"use strict";

(function () {
  var TOOLS = [
    { id: "json", name: "JSON Formatter", category: "Developer Essentials", description: "Format, minify, and validate JSON.", keywords: "pretty print object array" },
    { id: "uuid", name: "UUID Generator", category: "Developer Essentials", description: "Generate UUID version 4 identifiers.", keywords: "guid unique id" },
    { id: "base64", name: "Base64 Converter", category: "Developer Essentials", description: "Encode and decode UTF-8 text as Base64.", keywords: "btoa atob unicode" },
    { id: "timestamp", name: "Timestamp Converter", category: "Developer Essentials", description: "Convert Unix timestamps and dates.", keywords: "epoch unix iso date" },
    { id: "regex", name: "Regex Tester", category: "Developer Essentials", description: "Test JavaScript regular expressions.", keywords: "regexp match flags" },
    { id: "jwt", name: "JWT Decoder", category: "Developer Essentials", description: "Inspect JWT header and payload locally.", keywords: "token claims decode" },
    { id: "diff", name: "Text Diff Checker", category: "Text & Data", description: "Compare two texts line by line.", keywords: "compare lcs patch" },
    { id: "palette", name: "Color Palette Generator", category: "Design", description: "Generate and copy random color palettes.", keywords: "hex rgb css swatch" },
    { id: "settings", name: "Settings", category: "App", description: "Local preferences for this workspace.", keywords: "theme storage reset", hideFromSearch: true }
  ];

  var state = {
    tool: "json",
    favorites: [],
    palette: [],
    selectedSwatch: 0,
    uuidBatch: 0
  };

  // SVG icon paths for each tool, used to render favorites with matching icons
  var TOOL_ICONS = {
    json: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 5c-2 0-3 1.5-3 3.5S6 12 8 12c-2 0-3 1.5-3 3.5S6 19 8 19M16 5c2 0 3 1.5 3 3.5S18 12 16 12c2 0 3 1.5 3 3.5S18 19 16 19" stroke-linecap="round"/></svg>',
    uuid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="7" width="16" height="10" rx="2"/><path d="M8 11h.01M12 11h.01M16 11h.01" stroke-linecap="round"/></svg>',
    base64: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 8l-2 4 2 4M19 8l2 4-2 4M10 16l4-8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    timestamp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2" stroke-linecap="round"/></svg>',
    regex: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 16l4-8 4 8M7 13h4M16 8v8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    jwt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V8a4 4 0 018 0v2" stroke-linecap="round"/></svg>',
    diff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 5h6l4 4v10a1 1 0 01-1 1H7a1 1 0 01-1-1V6a1 1 0 011-1z"/><path d="M13 5v4h4M9 13h6M9 16h4" stroke-linecap="round"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="14" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="13" r="1.2" fill="currentColor"/></svg>'
  };

  function $(id) {
    return document.getElementById(id);
  }

  function toolById(id) {
    for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].id === id) return TOOLS[i];
    return TOOLS[0];
  }

  function loadFavorites() {
    var raw = DT.parseJsonSafe(DT.readStore(DT.STORAGE_KEYS.favorites), []);
    if (!Array.isArray(raw)) raw = [];
    var ids = {};
    TOOLS.forEach(function (t) { ids[t.id] = true; });
    state.favorites = raw.filter(function (id) { return typeof id === "string" && ids[id] && id !== "settings"; });
  }

  function saveFavorites() {
    DT.writeStore(DT.STORAGE_KEYS.favorites, JSON.stringify(state.favorites));
  }

  function isFavorite(id) {
    return state.favorites.indexOf(id) !== -1;
  }

  function renderFavorites() {
    var wrap = $("nav-favorites");
    var list = $("favorites-list");
    if (!wrap || !list) return;
    list.textContent = "";
    if (!state.favorites.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    state.favorites.forEach(function (id) {
      var t = toolById(id);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-btn" + (state.tool === id ? " active" : "");
      btn.setAttribute("data-tool", id);
      // Add the matching SVG icon
      if (TOOL_ICONS[id]) {
        var iconWrap = document.createElement("span");
        iconWrap.innerHTML = TOOL_ICONS[id];
        var svg = iconWrap.firstElementChild;
        if (svg) btn.appendChild(svg);
      }
      var span = document.createElement("span");
      span.textContent = t.name;
      btn.appendChild(span);
      list.appendChild(btn);
    });
    document.querySelectorAll(".nav-btn[data-tool]").forEach(function (btn) {
      var id = btn.getAttribute("data-tool");
      btn.classList.toggle("is-favorite", isFavorite(id));
    });
  }

  function setFavoriteButton() {
    var btn = $("favorite-btn");
    if (!btn) return;
    if (state.tool === "settings") {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;
    var on = isFavorite(state.tool);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Remove from favorites" : "Add to favorites");
  }

  function showTool(id, opts) {
    var tool = toolById(id);
    if (tool.id !== id && id !== "settings") tool = toolById("json");
    state.tool = tool.id;
    document.querySelectorAll(".tool-panel").forEach(function (panel) {
      panel.hidden = panel.id !== "tool-" + tool.id;
    });
    document.querySelectorAll(".nav-btn[data-tool]").forEach(function (btn) {
      var active = btn.getAttribute("data-tool") === tool.id;
      btn.classList.toggle("active", active);
      if (active) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
    DT.textContent($("tool-title"), tool.name);
    DT.textContent($("tool-category"), tool.category);
    document.title = tool.name + " · Dev Toolbox";
    setFavoriteButton();
    renderFavorites();
    if (!opts || opts.persist !== false) DT.writeStore(DT.STORAGE_KEYS.lastTool, tool.id);
    closeNav();
    if (tool.id === "timestamp") tickNow();
    if (tool.id === "json") jsonEmptyState();
  }

  function closeNav() {
    $("app").classList.remove("nav-open");
    var backdrop = $("nav-backdrop");
    if (backdrop) backdrop.hidden = true;
  }

  function openNav() {
    $("app").classList.add("nav-open");
    $("nav-backdrop").hidden = false;
  }

  /* JSON */
  function jsonEmptyState() {
    var input = $("json-input").value.trim();
    if (!input && !$("json-output").textContent) {
      DT.textContent($("json-output"), "Formatted JSON will appear here.");
      $("json-status").className = "status";
      DT.textContent($("json-status"), "Waiting for input");
    }
  }

  function parseJsonInput() {
    var raw = $("json-input").value;
    if (!raw.trim()) throw new Error("Input is empty. Paste JSON, including primitives such as 42, true, or null.");
    return JSON.parse(raw);
  }

  function showJsonError(err) {
    $("json-error").hidden = false;
    DT.textContent($("json-error"), err && err.message ? err.message : String(err));
    $("json-status").className = "status err";
    DT.textContent($("json-status"), "Invalid JSON");
  }

  function clearJsonError() {
    $("json-error").hidden = true;
    $("json-error").textContent = "";
  }

  function formatJson(minified) {
    clearJsonError();
    try {
      var value = parseJsonInput();
      var indent = minified ? 0 : Number($("json-indent").value) || 2;
      var out = JSON.stringify(value, null, indent);
      DT.textContent($("json-output"), out);
      $("json-status").className = "status ok";
      DT.textContent($("json-status"), minified ? "Minified" : "Formatted");
    } catch (err) {
      showJsonError(err);
    }
  }

  function validateJson() {
    clearJsonError();
    try {
      parseJsonInput();
      $("json-status").className = "status ok";
      DT.textContent($("json-status"), "Valid JSON");
      DT.toast("JSON is valid.", "success");
    } catch (err) {
      showJsonError(err);
    }
  }

  function copyJson(minified) {
    try {
      var value = parseJsonInput();
      var text = JSON.stringify(value, null, minified ? 0 : Number($("json-indent").value) || 2);
      DT.copyText(text);
    } catch (err) {
      showJsonError(err);
      DT.toast("Cannot copy invalid JSON.", "error");
    }
  }

  /* UUID */
  function renderUuidList(values, batch) {
    var list = $("uuid-list");
    list.textContent = "";
    values.forEach(function (id, index) {
      var row = document.createElement("div");
      row.className = "uuid-row";
      var code = document.createElement("code");
      code.className = "mono";
      code.textContent = id;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.textContent = "Copy";
      btn.setAttribute("data-uuid", id);
      btn.setAttribute("aria-label", "Copy UUID " + (index + 1) + " from batch " + batch);
      row.appendChild(code);
      row.appendChild(btn);
      list.appendChild(row);
    });
  }

  function generateUuids() {
    var n = Number($("uuid-quantity").value);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      DT.toast("Quantity must be an integer from 1 to 100.", "error");
      return;
    }
    var values = [];
    try {
      for (var i = 0; i < n; i++) values.push(DT.generateUuidV4());
    } catch (err) {
      DT.textContent($("uuid-status"), err.message);
      $("uuid-status").className = "status err";
      DT.toast(err.message, "error");
      return;
    }
    state.uuidBatch += 1;
    DT.textContent($("uuid-latest"), values[0]);
    renderUuidList(values, state.uuidBatch);
    $("uuid-status").className = "status ok";
    DT.textContent($("uuid-status"), "Generated " + values.length + " UUID v4 value" + (values.length === 1 ? "" : "s") + " (batch " + state.uuidBatch + ").");
    $("uuid-list").dataset.all = values.join("\n");
  }

  /* Base64 */
  function b64Mode() {
    return $("b64-encode").checked ? "encode" : "decode";
  }

  function convertBase64() {
    var input = $("b64-input").value;
    $("b64-status").className = "status";
    try {
      var out;
      if (b64Mode() === "encode") {
        if (!input.length) throw new Error("Input is empty.");
        out = DT.encodeUtf8Base64(input);
      } else {
        out = DT.decodeBase64Utf8(input);
      }
      $("b64-output").value = out;
      $("b64-status").className = "status ok";
      DT.textContent($("b64-status"), b64Mode() === "encode" ? "Encoded UTF-8 as Base64" : "Decoded Base64 as UTF-8");
    } catch (err) {
      $("b64-output").value = "";
      $("b64-status").className = "status err";
      DT.textContent($("b64-status"), err.message);
    }
  }

  /* Timestamp */
  function selectedUnit() {
    return $("ts-seconds").checked ? "s" : "ms";
  }

  function tickNow() {
    var now = Date.now();
    DT.textContent($("ts-now"), "Current: " + Math.floor(now / 1000) + " s  ·  " + now + " ms");
  }

  function showTsError(msg) {
    $("ts-error").hidden = false;
    DT.textContent($("ts-error"), msg);
  }

  function renderTimestamp(date) {
    $("ts-error").hidden = true;
    DT.textContent($("ts-out-s"), String(Math.floor(date.getTime() / 1000)));
    DT.textContent($("ts-out-ms"), String(date.getTime()));
    DT.textContent($("ts-out-iso"), date.toISOString());
    DT.textContent($("ts-out-local"), date.toString());
  }

  function convertUnix() {
    var raw = $("ts-unix").value.trim();
    if (!raw) {
      showTsError("Enter a Unix timestamp, or use Insert current timestamp.");
      return;
    }
    if (!/^-?\d+$/.test(raw)) {
      showTsError("Timestamp must be an integer. Fractional values are not accepted here.");
      return;
    }
    var n = Number(raw);
    if (!Number.isFinite(n)) {
      showTsError("Timestamp is not a finite number.");
      return;
    }
    var unit = selectedUnit();
    if (unit === "s" && Math.abs(n) >= 1e12) {
      showTsError("This value looks like milliseconds, but Seconds is selected. Switch the unit instead of guessing.");
      return;
    }
    if (unit === "ms" && Math.abs(n) > 0 && Math.abs(n) < 1e11) {
      showTsError("This value looks like seconds, but Milliseconds is selected. Switch the unit instead of guessing.");
      return;
    }
    var ms = unit === "s" ? n * 1000 : n;
    if (Math.abs(ms) > 8.64e15) {
      showTsError("Timestamp is outside the range JavaScript Date can represent.");
      return;
    }
    var date = new Date(ms);
    if (isNaN(date.getTime())) {
      showTsError("Could not convert that timestamp to a date.");
      return;
    }
    renderTimestamp(date);
    var local = toLocalInput(date);
    $("ts-datetime").value = local;
  }

  function toLocalInput(date) {
    var pad = function (v) { return String(v).padStart(2, "0"); };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + "T" +
      pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
  }

  function convertFromDate() {
    var value = $("ts-datetime").value;
    if (!value) {
      showTsError("Choose a local date and time.");
      return;
    }
    var date = new Date(value);
    if (isNaN(date.getTime())) {
      showTsError("That date/time is not valid.");
      return;
    }
    renderTimestamp(date);
    $("ts-unix").value = selectedUnit() === "s" ? String(Math.floor(date.getTime() / 1000)) : String(date.getTime());
  }

  /* Regex */
  function rxFlags() {
    var flags = "";
    if ($("rx-g").checked) flags += "g";
    if ($("rx-i").checked) flags += "i";
    if ($("rx-m").checked) flags += "m";
    if ($("rx-s").checked) flags += "s";
    if ($("rx-u").checked) flags += "u";
    return flags;
  }

  function runRegex() {
    var pattern = $("rx-pattern").value;
    var text = $("rx-text").value;
    var highlight = $("rx-highlight");
    var list = $("rx-matches");
    highlight.textContent = "";
    list.textContent = "";
    if (!pattern.length) {
      $("rx-status").className = "status";
      DT.textContent($("rx-status"), "Enter a pattern.");
      DT.textContent(highlight, text || "Matches will be highlighted here.");
      return;
    }
    var re;
    try {
      re = new RegExp(pattern, rxFlags());
    } catch (err) {
      $("rx-status").className = "status err";
      DT.textContent($("rx-status"), "Invalid pattern: " + err.message);
      DT.textContent(highlight, text);
      return;
    }
    var matches = [];
    var max = 400;
    if (re.global) {
      re.lastIndex = 0;
      var m;
      var safety = 0;
      while ((m = re.exec(text)) !== null && safety < max) {
        matches.push(m);
        if (m[0].length === 0) re.lastIndex += 1;
        safety += 1;
        if (re.lastIndex > text.length) break;
      }
      if (safety >= max) {
        $("rx-status").className = "status warn";
        DT.textContent($("rx-status"), "Stopped after " + max + " matches to protect the UI.");
      } else {
        $("rx-status").className = "status ok";
        DT.textContent($("rx-status"), matches.length ? matches.length + " match" + (matches.length === 1 ? "" : "es") : "No matches");
      }
    } else {
      m = re.exec(text);
      if (m) matches.push(m);
      $("rx-status").className = "status ok";
      DT.textContent($("rx-status"), matches.length ? "1 match (without g, only the first is reported)" : "No matches");
    }
    renderHighlights(highlight, text, matches);
    matches.forEach(function (match, idx) {
      var item = document.createElement("div");
      item.className = "match-item";
      var groups = [];
      for (var g = 1; g < match.length; g++) {
        groups.push("group " + g + ": " + (match[g] == null ? "(unmatched)" : JSON.stringify(match[g])));
      }
      item.textContent = "#" + (idx + 1) + " @ " + match.index + "  " + JSON.stringify(match[0]) +
        (groups.length ? "\n" + groups.join("\n") : "");
      list.appendChild(item);
    });
    if (!matches.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No matches found.";
      list.appendChild(empty);
    }
  }

  function renderHighlights(container, text, matches) {
    container.textContent = "";
    if (!text) {
      container.textContent = "Matches will be highlighted here.";
      return;
    }
    var ranges = matches.filter(function (m) { return m[0].length > 0; }).map(function (m) {
      return { start: m.index, end: m.index + m[0].length };
    }).sort(function (a, b) { return a.start - b.start; });
    var pos = 0;
    ranges.forEach(function (r) {
      if (r.start < pos) return;
      if (r.start > pos) container.appendChild(document.createTextNode(text.slice(pos, r.start)));
      var mark = document.createElement("mark");
      mark.textContent = text.slice(r.start, r.end);
      container.appendChild(mark);
      pos = r.end;
    });
    if (pos < text.length) container.appendChild(document.createTextNode(text.slice(pos)));
  }

  /* JWT */
  function decodeJwt() {
    var token = $("jwt-input").value.trim();
    $("jwt-error").hidden = true;
    $("jwt-claims").textContent = "";
    DT.textContent($("jwt-header"), "");
    DT.textContent($("jwt-payload"), "");
    DT.textContent($("jwt-sig"), "");
    if (!token) {
      showJwtError("Paste a JWT. Nothing is sent anywhere.");
      return;
    }
    var parts = token.split(".");
    if (parts.length !== 3 || !parts[0] || !parts[1]) {
      showJwtError("A JWT should have three dot-separated segments: header.payload.signature.");
      return;
    }
    var headerText;
    var payloadText;
    try {
      headerText = DT.decodeBase64UrlUtf8(parts[0]);
      payloadText = DT.decodeBase64UrlUtf8(parts[1]);
    } catch (err) {
      showJwtError(err.message);
      return;
    }
    var header;
    var payload;
    try {
      header = JSON.parse(headerText);
      payload = JSON.parse(payloadText);
    } catch (err) {
      showJwtError("Header or payload is not valid JSON: " + err.message);
      return;
    }
    DT.textContent($("jwt-header"), JSON.stringify(header, null, 2));
    DT.textContent($("jwt-payload"), JSON.stringify(payload, null, 2));
    DT.textContent($("jwt-sig"), parts[2] || "(empty signature segment)");
    $("jwt-header").dataset.raw = JSON.stringify(header, null, 2);
    $("jwt-payload").dataset.raw = JSON.stringify(payload, null, 2);
    renderClaims(header, payload);
    $("jwt-status").className = "status ok";
    DT.textContent($("jwt-status"), "Decoded locally · signature not verified");
  }

  function showJwtError(msg) {
    $("jwt-error").hidden = false;
    DT.textContent($("jwt-error"), msg);
    $("jwt-status").className = "status err";
    DT.textContent($("jwt-status"), "Could not decode");
  }

  function claimRow(dl, name, value) {
    var dt = document.createElement("dt");
    dt.textContent = name;
    var dd = document.createElement("dd");
    dd.className = "mono";
    dd.textContent = value;
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  function renderClaims(header, payload) {
    var dl = $("jwt-claims");
    if (header && header.alg != null) claimRow(dl, "alg", String(header.alg));
    else claimRow(dl, "alg", "absent");
    var keys = ["iss", "sub", "aud", "iat", "nbf", "exp", "jti"];
    keys.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(payload, key)) {
        claimRow(dl, key, "absent");
        return;
      }
      var val = payload[key];
      if ((key === "iat" || key === "nbf" || key === "exp")) {
        if (typeof val !== "number" || !isFinite(val)) {
          claimRow(dl, key, "present but invalid NumericDate: " + JSON.stringify(val));
          return;
        }
        var formatted = DT.formatNumericDate(val);
        var extra = "";
        if (key === "exp" && formatted.ok) {
          extra = val * 1000 <= Date.now() ? " · appears expired vs local clock" : " · not expired vs local clock";
        }
        claimRow(dl, key, val + " → " + (formatted.ok ? formatted.label : formatted.label) + extra);
        return;
      }
      claimRow(dl, key, typeof val === "string" ? val : JSON.stringify(val));
    });
  }

  /* Diff */
  function runDiff() {
    var a = $("diff-a").value;
    var b = $("diff-b").value;
    var view = $("diff-view");
    view.textContent = "";
    try {
      var ops = DT.lineDiff(a, b);
      var add = 0;
      var del = 0;
      var same = 0;
      ops.forEach(function (op) {
        if (op.type === "add") add += 1;
        else if (op.type === "del") del += 1;
        else same += 1;
      });
      if (a === b) {
        $("diff-status").className = "status ok";
        DT.textContent($("diff-status"), "The two texts are identical.");
      } else {
        $("diff-status").className = "status ok";
        DT.textContent($("diff-status"), "Compared " + ops.length + " line slots.");
      }
      DT.textContent($("diff-summary"), add + " added · " + del + " removed · " + same + " unchanged");
      var left = document.createElement("div");
      var right = document.createElement("div");
      left.className = "diff-col";
      right.className = "diff-col";
      var plain = [];
      ops.forEach(function (op) {
        if (op.type === "same" || op.type === "del") {
          left.appendChild(diffLine(op.a, op.text, op.type === "del" ? "del" : "same"));
        } else {
          left.appendChild(diffLine("", "", "pad"));
        }
        if (op.type === "same" || op.type === "add") {
          right.appendChild(diffLine(op.b, op.text, op.type === "add" ? "add" : "same"));
        } else {
          right.appendChild(diffLine("", "", "pad"));
        }
        if (op.type === "del") plain.push("- " + op.text);
        else if (op.type === "add") plain.push("+ " + op.text);
        else plain.push("  " + op.text);
      });
      view.appendChild(left);
      view.appendChild(right);
      view.dataset.plain = plain.join("\n");
    } catch (err) {
      $("diff-status").className = "status err";
      DT.textContent($("diff-status"), err.message);
      DT.textContent($("diff-summary"), "");
    }
  }

  function diffLine(num, text, type) {
    var row = document.createElement("div");
    row.className = "diff-line " + type;
    var ln = document.createElement("span");
    ln.className = "ln";
    ln.textContent = num || "";
    var tx = document.createElement("span");
    tx.className = "tx";
    tx.textContent = text;
    row.appendChild(ln);
    row.appendChild(tx);
    return row;
  }

  /* Palette */
  function ensurePalette() {
    if (state.palette.length === 5) return;
    state.palette = [];
    for (var i = 0; i < 5; i++) {
      state.palette.push({ hex: DT.randomHex(), locked: false });
    }
  }

  function generatePalette() {
    try {
      ensurePalette();
      state.palette.forEach(function (c) {
        if (!c.locked) c.hex = DT.randomHex();
      });
      renderPalette();
      DT.textContent($("pal-status"), "Generated random colors. Locked swatches were kept.");
    } catch (err) {
      DT.toast(err.message, "error");
    }
  }

  function renderPalette() {
    var wrap = $("pal-swatches");
    wrap.textContent = "";
    state.palette.forEach(function (c, i) {
      var rgb = DT.hexToRgb(c.hex);
      var swatch = document.createElement("div");
      swatch.className = "swatch" + (state.selectedSwatch === i ? " selected" : "");
      var face = document.createElement("button");
      face.type = "button";
      face.className = "swatch-face";
      face.style.background = c.hex;
      face.style.color = DT.contrastText(c.hex);
      face.textContent = c.hex;
      face.setAttribute("aria-label", "Select color " + (i + 1) + " " + c.hex);
      face.addEventListener("click", function () {
        state.selectedSwatch = i;
        renderPalette();
      });
      var meta = document.createElement("div");
      meta.className = "swatch-meta";
      // Manual hex input
      var hexInput = document.createElement("input");
      hexInput.type = "text";
      hexInput.className = "swatch-hex-input";
      hexInput.value = c.hex;
      hexInput.setAttribute("aria-label", "Hex color for swatch " + (i + 1));
      hexInput.addEventListener("change", (function (idx) {
        return function () {
          var raw = hexInput.value.trim();
          if (!raw.startsWith("#")) raw = "#" + raw;
          var parsed = DT.hexToRgb(raw);
          if (parsed) {
            state.palette[idx].hex = parsed.hex;
            renderPalette();
          } else {
            DT.toast("Invalid hex color.", "error");
            hexInput.value = state.palette[idx].hex;
          }
        };
      })(i));
      var lock = document.createElement("button");
      lock.type = "button";
      lock.className = "btn";
      lock.textContent = c.locked ? "Unlock" : "Lock";
      lock.setAttribute("aria-pressed", c.locked ? "true" : "false");
      lock.addEventListener("click", function () {
        c.locked = !c.locked;
        renderPalette();
      });
      var copy = document.createElement("button");
      copy.type = "button";
      copy.className = "btn";
      copy.textContent = "HEX";
      copy.addEventListener("click", function () { DT.copyText(c.hex); });
      meta.appendChild(hexInput);
      meta.appendChild(lock);
      meta.appendChild(copy);
      swatch.appendChild(face);
      swatch.appendChild(meta);
      wrap.appendChild(swatch);
      c.rgb = rgb;
    });
    renderPaletteDetail();
    renderPalettePreview();
  }

  function renderPaletteDetail() {
    var c = state.palette[state.selectedSwatch];
    var box = $("pal-detail");
    box.textContent = "";
    if (!c || !c.rgb) return;
    var title = document.createElement("strong");
    title.textContent = "Selected swatch " + (state.selectedSwatch + 1);
    box.appendChild(title);
    var line = document.createElement("p");
    line.className = "mono";
    line.textContent = c.hex + "  ·  rgb(" + c.rgb.r + ", " + c.rgb.g + ", " + c.rgb.b + ")";
    box.appendChild(line);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = "Copy RGB";
    btn.addEventListener("click", function () {
      DT.copyText("rgb(" + c.rgb.r + ", " + c.rgb.g + ", " + c.rgb.b + ")");
    });
    box.appendChild(btn);
  }

  function renderPalettePreview() {
    var box = $("pal-preview");
    box.textContent = "";
    if (state.palette.length < 5) return;
    var bg = state.palette[0].hex;
    var surface = state.palette[1].hex;
    var accent = state.palette[2].hex;
    var text = state.palette[3].hex;
    var muted = state.palette[4].hex;
    var card = document.createElement("div");
    card.className = "preview-card";
    card.style.background = surface;
    card.style.color = text;
    var h = document.createElement("h3");
    h.textContent = "Sample card";
    h.style.margin = "0 0 8px";
    var p = document.createElement("p");
    p.textContent = "Preview uses swatches 1–5 as background, surface, accent, text, and muted.";
    p.style.color = muted;
    p.style.margin = "0 0 12px";
    var b = document.createElement("button");
    b.type = "button";
    b.className = "preview-btn";
    b.textContent = "Sample button";
    b.style.background = accent;
    b.style.color = DT.contrastText(accent);
    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(b);
    var page = document.createElement("div");
    page.className = "preview-card";
    page.style.background = bg;
    page.style.color = text;
    var t = document.createElement("p");
    t.textContent = "Sample text on the first swatch.";
    page.appendChild(t);
    box.appendChild(card);
    box.appendChild(page);
  }

  function paletteCss() {
    var lines = [":root {"];
    state.palette.forEach(function (c, i) {
      lines.push("  --color-" + (i + 1) + ": " + c.hex + ";");
    });
    lines.push("}");
    return lines.join("\n");
  }

  /* Command palette */
  var paletteIndex = 0;
  var paletteHits = [];

  function searchableTools() {
    return TOOLS.filter(function (t) { return !t.hideFromSearch; });
  }

  function openPalette() {
    $("palette-overlay").hidden = false;
    $("palette-input").value = "";
    filterPalette("");
    $("palette-input").focus();
  }

  function closePalette() {
    $("palette-overlay").hidden = true;
  }

  function filterPalette(q) {
    var query = q.trim().toLowerCase();
    paletteHits = searchableTools().filter(function (t) {
      if (!query) return true;
      return (t.name + " " + t.description + " " + t.category + " " + t.keywords).toLowerCase().indexOf(query) !== -1;
    });
    paletteIndex = 0;
    var list = $("palette-list");
    list.textContent = "";
    if (!paletteHits.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No tools match that search.";
      list.appendChild(empty);
      return;
    }
    paletteHits.forEach(function (t, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "palette-item" + (i === 0 ? " active" : "");
      btn.setAttribute("role", "option");
      var name = document.createElement("span");
      name.textContent = t.name;
      var small = document.createElement("small");
      small.textContent = t.description;
      btn.appendChild(name);
      btn.appendChild(small);
      btn.addEventListener("click", function () {
        showTool(t.id);
        closePalette();
      });
      list.appendChild(btn);
    });
  }

  function movePalette(delta) {
    if (!paletteHits.length) return;
    paletteIndex = (paletteIndex + delta + paletteHits.length) % paletteHits.length;
    var items = $("palette-list").querySelectorAll(".palette-item");
    items.forEach(function (el, i) {
      el.classList.toggle("active", i === paletteIndex);
    });
    if (items[paletteIndex]) items[paletteIndex].scrollIntoView({ block: "nearest" });
  }

  function bind() {
    DT.applyTheme(DT.getTheme(), false);
    loadFavorites();

    document.getElementById("theme-toggle").addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      DT.applyTheme(current === "dark" ? "light" : "dark", true);
      DT.toast("Theme saved.", "success");
    });

    $("collapse-sidebar").addEventListener("click", function () {
      $("app").classList.toggle("sidebar-collapsed");
      var collapsed = $("app").classList.contains("sidebar-collapsed");
      DT.writeStore(DT.STORAGE_KEYS.sidebar, collapsed ? "1" : "0");
      $("collapse-sidebar").setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    });
    if (DT.readStore(DT.STORAGE_KEYS.sidebar) === "1") $("app").classList.add("sidebar-collapsed");

    $("menu-btn").addEventListener("click", openNav);
    $("nav-backdrop").addEventListener("click", closeNav);

    $("nav").addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-tool]");
      if (btn) showTool(btn.getAttribute("data-tool"));
    });

    $("favorite-btn").addEventListener("click", function () {
      var id = state.tool;
      if (id === "settings") return;
      var idx = state.favorites.indexOf(id);
      if (idx >= 0) state.favorites.splice(idx, 1);
      else state.favorites.push(id);
      saveFavorites();
      setFavoriteButton();
      renderFavorites();
      DT.toast(idx >= 0 ? "Removed from favorites." : "Added to favorites.", "success");
    });

    $("open-search").addEventListener("click", openPalette);
    $("header-search").addEventListener("click", openPalette);
    $("palette-overlay").addEventListener("click", function (ev) {
      if (ev.target.id === "palette-overlay") closePalette();
    });
    $("palette-input").addEventListener("input", function (ev) {
      filterPalette(ev.target.value);
    });

    document.addEventListener("keydown", function (ev) {
      var metaK = (ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k";
      if (metaK) {
        ev.preventDefault();
        if ($("palette-overlay").hidden) openPalette();
        else closePalette();
        return;
      }
      if ($("palette-overlay").hidden) {
        if (ev.key === "Escape") closeNav();
        return;
      }
      if (ev.key === "Escape") {
        ev.preventDefault();
        closePalette();
      } else if (ev.key === "ArrowDown") {
        ev.preventDefault();
        movePalette(1);
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        movePalette(-1);
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        if (paletteHits[paletteIndex]) {
          showTool(paletteHits[paletteIndex].id);
          closePalette();
        }
      }
    });

    $("json-format").addEventListener("click", function () { formatJson(false); });
    $("json-minify").addEventListener("click", function () { formatJson(true); });
    $("json-validate").addEventListener("click", validateJson);
    $("json-copy-formatted").addEventListener("click", function () { copyJson(false); });
    $("json-copy-minified").addEventListener("click", function () { copyJson(true); });
    $("json-sample").addEventListener("click", function () {
      $("json-input").value = JSON.stringify({
        name: "Dev Toolbox",
        local: true,
        counts: [1, 2, 3],
        nested: { ok: true, note: "Unicode ✓" },
        empty: null
      }, null, 2);
      formatJson(false);
    });
    $("json-clear").addEventListener("click", function () {
      if (!$("json-input").value && !$("json-output").textContent) return;
      DT.confirm("Clear the JSON input and output? Unsaved text will be lost.").then(function (ok) {
        if (!ok) return;
        $("json-input").value = "";
        $("json-output").textContent = "";
        clearJsonError();
        jsonEmptyState();
        DT.toast("JSON editors cleared.", "success");
      });
    });

    $("uuid-generate").addEventListener("click", generateUuids);
    $("uuid-copy-latest").addEventListener("click", function () {
      var t = $("uuid-latest").textContent;
      if (t.indexOf("-") === -1) DT.toast("Generate a UUID first.", "error");
      else DT.copyText(t);
    });
    $("uuid-copy-all").addEventListener("click", function () {
      var all = $("uuid-list").dataset.all;
      if (!all) DT.toast("No UUIDs to copy.", "error");
      else DT.copyText(all);
    });
    $("uuid-clear").addEventListener("click", function () {
      $("uuid-list").textContent = "";
      $("uuid-list").dataset.all = "";
      DT.textContent($("uuid-latest"), "Generate a UUID to begin");
      DT.textContent($("uuid-status"), "");
      DT.toast("UUID results cleared.", "success");
    });
    $("uuid-list").addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-uuid]");
      if (btn) DT.copyText(btn.getAttribute("data-uuid"));
    });

    $("b64-convert").addEventListener("click", convertBase64);
    $("b64-swap").addEventListener("click", function () {
      var inp = $("b64-input").value;
      var out = $("b64-output").value;
      $("b64-input").value = out;
      $("b64-output").value = inp;
      if (b64Mode() === "encode") $("b64-decode").checked = true;
      else $("b64-encode").checked = true;
    });
    $("b64-copy").addEventListener("click", function () { DT.copyText($("b64-output").value); });
    $("b64-sample").addEventListener("click", function () {
      $("b64-encode").checked = true;
      $("b64-input").value = "Hello, 世界 — Dev Toolbox 👋";
      convertBase64();
    });
    $("b64-clear").addEventListener("click", function () {
      $("b64-input").value = "";
      $("b64-output").value = "";
      DT.textContent($("b64-status"), "");
    });

    $("ts-convert").addEventListener("click", convertUnix);
    $("ts-from-date").addEventListener("click", convertFromDate);
    $("ts-insert").addEventListener("click", function () {
      var now = Date.now();
      $("ts-unix").value = selectedUnit() === "s" ? String(Math.floor(now / 1000)) : String(now);
      convertUnix();
    });
    document.querySelectorAll("[data-copy-from]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var el = $(btn.getAttribute("data-copy-from"));
        var val = el ? el.textContent : "";
        if (!val || val === "—") DT.toast("Convert a timestamp first.", "error");
        else DT.copyText(val);
      });
    });
    setInterval(function () {
      if (state.tool === "timestamp") tickNow();
    }, 1000);
    tickNow();

    $("rx-test").addEventListener("click", runRegex);
    $("rx-sample").addEventListener("change", function () {
      var v = $("rx-sample").value;
      if (v === "digits") {
        $("rx-pattern").value = "\\d+";
        $("rx-text").value = "Order 42 ships in 7 days.";
      } else if (v === "email") {
        $("rx-pattern").value = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+";
        $("rx-text").value = "Write to ada@example.com or skip this. This is not a complete email validator.";
      } else if (v === "ws") {
        $("rx-pattern").value = "\\s+";
        $("rx-text").value = "tabs\tand  spaces\nnewlines";
      }
      if (v) runRegex();
    });
    ["rx-pattern", "rx-text", "rx-g", "rx-i", "rx-m", "rx-s", "rx-u"].forEach(function (id) {
      $(id).addEventListener("input", function () {
        if ($("rx-text").value.length < 40000) runRegex();
      });
      $(id).addEventListener("change", function () {
        if ($("rx-text").value.length < 40000) runRegex();
      });
    });

    $("jwt-decode").addEventListener("click", decodeJwt);
    $("jwt-sample").addEventListener("click", function () {
      // Public illustration token. Signature is not verified and is not a secret.
      $("jwt-input").value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDkwMjJ9.illustration-signature";
      decodeJwt();
    });
    $("jwt-copy-header").addEventListener("click", function () {
      DT.copyText($("jwt-header").dataset.raw || "");
    });
    $("jwt-copy-payload").addEventListener("click", function () {
      DT.copyText($("jwt-payload").dataset.raw || "");
    });
    $("jwt-clear").addEventListener("click", function () {
      $("jwt-input").value = "";
      $("jwt-header").textContent = "";
      $("jwt-payload").textContent = "";
      $("jwt-sig").textContent = "";
      $("jwt-claims").textContent = "";
      $("jwt-header").dataset.raw = "";
      $("jwt-payload").dataset.raw = "";
      $("jwt-error").hidden = true;
      DT.textContent($("jwt-status"), "");
      DT.toast("JWT input cleared.", "success");
    });

    $("diff-compare").addEventListener("click", runDiff);
    $("diff-swap").addEventListener("click", function () {
      var a = $("diff-a").value;
      $("diff-a").value = $("diff-b").value;
      $("diff-b").value = a;
    });
    $("diff-copy").addEventListener("click", function () {
      DT.copyText($("diff-view").dataset.plain || "");
    });
    $("diff-sample").addEventListener("click", function () {
      $("diff-a").value = "alpha\nbeta\ngamma\n";
      $("diff-b").value = "alpha\nbeta-edit\ngamma\ndelta\n";
      runDiff();
    });
    $("diff-clear").addEventListener("click", function () {
      DT.confirm("Clear both diff editors and results?").then(function (ok) {
        if (!ok) return;
        $("diff-a").value = "";
        $("diff-b").value = "";
        $("diff-view").textContent = "";
        DT.textContent($("diff-summary"), "");
        DT.textContent($("diff-status"), "Enter two texts and compare.");
      });
    });

    $("pal-generate").addEventListener("click", generatePalette);
    $("pal-copy-css").addEventListener("click", function () {
      if (!state.palette.length) generatePalette();
      DT.copyText(paletteCss());
    });
    $("pal-unlock").addEventListener("click", function () {
      state.palette.forEach(function (c) { c.locked = false; });
      renderPalette();
    });

    $("settings-reset").addEventListener("click", function () {
      DT.confirm("Remove saved theme, sidebar, last tool, and favorites from LocalStorage?").then(function (ok) {
        if (!ok) return;
        Object.keys(DT.STORAGE_KEYS).forEach(function (k) {
          DT.removeStore(DT.STORAGE_KEYS[k]);
        });
        state.favorites = [];
        $("app").classList.remove("sidebar-collapsed");
        DT.applyTheme(DT.getTheme(), false);
        renderFavorites();
        setFavoriteButton();
        DT.toast("Preferences cleared.", "success");
      });
    });

    var last = DT.readStore(DT.STORAGE_KEYS.lastTool);
    var start = toolById(last || "json");
    showTool(start.id, { persist: false });
    jsonEmptyState();
    try { generatePalette(); } catch (err) { /* palette remains empty until Generate */ }
    var kbd = document.querySelector(".sidebar-search kbd");
    if (kbd && /Mac|iPhone|iPad/.test(navigator.platform || "")) kbd.textContent = "⌘K";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
