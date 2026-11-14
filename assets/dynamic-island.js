/*
 * TIMPS PostCards — Dynamic Island
 * ------------------------------------------------------------------
 * A Dynamic-Island-style capsule for the installed PWA. It renders in
 * a shadow root so the site's styles can never leak into it (and vice
 * versa), sits below the notch via safe-area insets, collapses to a
 * pill and expands to the day's five headlines.
 *
 * Works in mobile Safari (iOS 16.4+, installed to Home Screen) and
 * Android Chrome (installed or in-browser). No native APIs, no
 * ActivityKit — those only exist for native apps.
 *
 * Data sources, in priority order:
 *   1. A push payload forwarded by sw.js  -> window message TIMPS_PUSH
 *   2. The five .story-card headlines on the current daily page
 *   3. The latest daily page, fetched and parsed (home / archive pages)
 *
 * Usage: <script src="assets/dynamic-island.js" defer></script>
 *        <script ... data-mode="home"> to force the fetch path.
 * Add ?island=1 to any URL to force it open (used by notification taps).
 */
(function () {
  "use strict";
  if (window.__TIMPS_ISLAND__) return;
  window.__TIMPS_ISLAND__ = true;

  var scriptEl = document.querySelector('script[src*="dynamic-island.js"]');
  var forcedMode = scriptEl && scriptEl.dataset ? scriptEl.dataset.mode : "";
  var params = new URLSearchParams(window.location.search);
  var forceOpen = params.get("island") === "1";

  // Only bother phones and narrow windows / installed apps.
  var standalone = false;
  try {
    standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  } catch (e) {}
  var narrow = window.innerWidth <= 820;
  if (!(forceOpen || standalone || narrow)) return;

  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var ACCENT = "#DA7756";
  var STORE_KEY = "timps-island-seen";
  var HOST_ID = "timps-dynamic-island";

  var state = {
    issue: "",
    date: "",
    stories: [],
    url: "",
    key: "",
    expanded: false,
    collapsedByUser: false,
    fromPush: false
  };
  var autoExpandTimer = null;
  var autoCollapseTimer = null;
  var host, frame, bar, metaEl, rowsEl, ctaEl, chevEl, shadow;

  /* ── helpers ─────────────────────────────────────────────────── */

  function clean(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function two(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function issueKey(data) {
    return (data.issue || data.date || data.title || "issue") + "|" + (data.date || "");
  }

  function seen(key) {
    try {
      return localStorage.getItem(STORE_KEY) === key;
    } catch (e) {
      return false;
    }
  }

  function markSeen(key) {
    try {
      localStorage.setItem(STORE_KEY, key);
    } catch (e) {}
  }

  function absolute(href) {
    try {
      return new URL(href, window.location.href).href;
    } catch (e) {
      return href;
    }
  }

  /* ── data extraction ─────────────────────────────────────────── */

  function readDoc(doc, pageUrl) {
    var data = { issue: "", date: "", title: "TIMPS PostCards", stories: [], url: pageUrl };
    var meta = doc.querySelectorAll(".cover-meta span");
    if (meta.length >= 2) {
      data.issue = clean(meta[0].textContent);
      data.date = clean(meta[1].textContent);
    }
    var cover = doc.querySelector(".cover-title");
    if (cover) data.title = clean(cover.textContent).replace(/\n/g, " ") || data.title;

    var cards = doc.querySelectorAll(".story-card");
    for (var i = 0; i < cards.length && data.stories.length < 5; i++) {
      var h = cards[i].querySelector("h2.card-headline");
      if (!h || h.classList.contains("sm")) continue;
      var routine = clean((cards[i].querySelector(".card-routine") || {}).textContent);
      var bits = routine.split("·");
      var cat = clean(bits[0] || "");
      var label = clean(bits[1] || bits[0] || "");
      data.stories.push({
        num: two(data.stories.length + 1),
        cat: cat,
        label: label,
        headline: clean(h.textContent),
        hash: cards[i].id || "story-" + (data.stories.length + 1)
      });
    }
    return data;
  }

  function readCurrentPage() {
    if (!document.querySelector(".card-headline")) return null;
    var data = readDoc(document, window.location.href.split("?")[0].split("#")[0]);
    if (!data.stories.length) return null;
    data.url = ""; // same page: links are in-page anchors
    return data;
  }

  function latestIssueHref() {
    var links = document.querySelectorAll('a[href*="daily/timps-postcards-"][href$=".html"]');
    if (!links.length) return "";
    // The nav links the newest issue first in document order.
    var best = "";
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href");
      if (href && href > best) best = href;
    }
    return best;
  }

  function readLatestIssue() {
    if (forcedMode === "home" || !document.querySelector(".card-headline")) {
      var href = latestIssueHref();
      if (!href) return Promise.resolve(null);
      var url = absolute(href);
      return fetch(url, { credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) throw new Error("fetch " + r.status);
          return r.text();
        })
        .then(function (text) {
          var doc = new DOMParser().parseFromString(text, "text/html");
          var data = readDoc(doc, url);
          data.url = url;
          return data.stories.length ? data : null;
        })
        .catch(function () {
          // Offline / fetch blocked: fall back to the homepage card if present.
          var titleEl = document.querySelector(".today-issue-title");
          var deckEl = document.querySelector(".today-issue-deck");
          if (!titleEl) return null;
          return {
            issue: "",
            date: "",
            title: "TIMPS PostCards",
            url: href,
            stories: [
              {
                num: "01",
                cat: "Today",
                label: "",
                headline: clean(titleEl.textContent),
                hash: ""
              }
            ],
            _deck: clean(deckEl ? deckEl.textContent : "")
          };
        });
    }
    return Promise.resolve(readCurrentPage());
  }

  function dataFromPush(payload) {
    if (!payload) return null;
    var stories = [];
    var raw = payload.stories || [];
    for (var i = 0; i < raw.length && stories.length < 5; i++) {
      var s = raw[i];
      if (typeof s === "string") {
        stories.push({ num: two(i + 1), cat: "", label: "", headline: s, hash: "" });
      } else if (s && s.headline) {
        stories.push({
          num: two(i + 1),
          cat: clean(s.cat || s.category || ""),
          label: clean(s.label || ""),
          headline: clean(s.headline),
          hash: clean(s.hash || "")
        });
      }
    }
    var url = payload.url ? absolute(payload.url) : "";
    return {
      issue: clean(payload.issue || ""),
      date: clean(payload.date || ""),
      title: clean(payload.title || "TIMPS PostCards"),
      stories: stories,
      url: url
    };
  }

  /* ── rendering ───────────────────────────────────────────────── */

  function build() {
    host = document.createElement("div");
    host.id = HOST_ID;
    host.setAttribute("data-timps-island", "");
    host.style.cssText =
      "position:fixed;top:0;left:0;right:0;display:flex;justify-content:center;" +
      "padding-top:calc(env(safe-area-inset-top, 0px) + 6px);" +
      "z-index:2147483000;pointer-events:none;";

    shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML =
      "<style>" +
      ":host{all:initial}" +
      ".frame{pointer-events:auto;background:#08080a;color:#fff;width:208px;max-height:40px;" +
      "overflow:hidden;border-radius:22px;transform-origin:50% 0;" +
      "box-shadow:0 12px 34px rgba(0,0,0,.34),0 0 0 1px rgba(255,255,255,.07) inset;" +
      "font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,system-ui,sans-serif;" +
      "opacity:0;transform:translateY(-14px) scale(.96);" +
      "transition:width .42s cubic-bezier(.2,.9,.2,1),max-height .42s cubic-bezier(.2,.9,.2,1)," +
      "border-radius .32s ease,opacity .3s ease,transform .42s cubic-bezier(.2,.9,.2,1),background .3s ease;}" +
      ".frame.in{opacity:1;transform:none}" +
      ".frame[data-state=expanded]{width:min(88vw,372px);max-height:min(74vh,540px);border-radius:28px;" +
      "background:#0a0a0c;box-shadow:0 24px 60px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.08) inset;}" +
      ".bar{display:flex;align-items:center;gap:8px;width:100%;height:40px;padding:0 13px;" +
      "background:transparent;border:0;color:inherit;cursor:pointer;text-align:left;" +
      "font:600 12px/1 inherit;letter-spacing:.02em;white-space:nowrap;-webkit-tap-highlight-color:transparent;}" +
      ".live{width:7px;height:7px;border-radius:50%;background:" + ACCENT + ";flex:0 0 auto;" +
      "box-shadow:0 0 0 0 rgba(218,119,86,.55);animation:pulse 2.4s ease-out infinite;}" +
      "[data-state=expanded] .live{animation:none;background:#4ADE80;box-shadow:0 0 0 0 transparent;}" +
      "@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(218,119,86,.5)}70%{box-shadow:0 0 0 6px rgba(218,119,86,0)}100%{box-shadow:0 0 0 0 rgba(218,119,86,0)}}" +
      ".brand{font-weight:800;letter-spacing:.14em;font-size:11px}" +
      ".divider{width:1px;height:12px;background:rgba(255,255,255,.18);flex:0 0 auto}" +
      ".meta{font-size:10.5px;font-weight:600;letter-spacing:.06em;color:rgba(255,255,255,.62);" +
      "overflow:hidden;text-overflow:ellipsis;flex:1 1 auto;min-width:0}" +
      ".chev{flex:0 0 auto;width:14px;height:14px;opacity:.55;transition:transform .32s ease}" +
      "[data-state=expanded] .chev{transform:rotate(180deg);opacity:.75}" +
      ".body{opacity:0;transform:translateY(-4px);transition:opacity .22s ease,transform .3s ease;}" +
      ".frame[data-state=expanded] .body{opacity:1;transform:none;transition-delay:.08s}" +
      ".head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 14px 8px;" +
      "border-top:1px solid rgba(255,255,255,.08);padding-top:9px;margin-top:1px;" +
      "font:700 9px/1 inherit;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.42)}" +
      ".head span:last-child{color:rgba(255,255,255,.3);font-weight:600;letter-spacing:.08em}" +
      ".row{display:grid;grid-template-columns:22px 1fr;gap:10px;padding:10px 14px;text-decoration:none;" +
      "color:#fff;border-top:1px solid rgba(255,255,255,.07);-webkit-tap-highlight-color:transparent;}" +
      ".row:active{background:rgba(255,255,255,.07)}" +
      ".n{font:800 10px/1.5 inherit;letter-spacing:.1em;color:" + ACCENT + ";padding-top:2px}" +
      ".cat{display:block;font:700 8.5px/1 inherit;letter-spacing:.14em;text-transform:uppercase;" +
      "color:rgba(255,255,255,.4);margin-bottom:3px;" +
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".hl{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;" +
      "font:600 12.5px/1.34 inherit;letter-spacing:-.005em}" +
      ".cta{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px 13px;" +
      "border-top:1px solid rgba(255,255,255,.08);text-decoration:none;color:" + ACCENT + ";" +
      "font:700 10px/1 inherit;letter-spacing:.1em;text-transform:uppercase;}" +
      ".cta span{font-weight:600;color:rgba(255,255,255,.45);letter-spacing:.06em;text-transform:none;font-size:10px}" +
      ".empty{padding:12px 14px 14px;border-top:1px solid rgba(255,255,255,.08);" +
      "font:500 12px/1.5 inherit;color:rgba(255,255,255,.55)}" +
      "@media (prefers-reduced-motion:reduce){.frame{transition:opacity .2s ease}" +
      ".live{animation:none}.body{transition:opacity .15s ease}.chev{transition:none}}" +
      "</style>" +
      '<div class="frame" data-state="collapsed">' +
      '<button class="bar" type="button" aria-expanded="false" aria-label="Today\'s TIMPS headlines">' +
      '<span class="live" aria-hidden="true"></span>' +
      '<span class="brand">TIMPS</span>' +
      '<span class="divider" aria-hidden="true"></span>' +
      '<span class="meta">Today&rsquo;s signals</span>' +
      '<svg class="chev" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "</button>" +
      '<div class="body" role="region" aria-label="Headlines">' +
      '<div class="head"><span class="issue">Today</span><span class="date"></span></div>' +
      '<div class="rows"></div>' +
      "</div>" +
      "</div>";

    document.body.appendChild(host);

    frame = shadow.querySelector(".frame");
    bar = shadow.querySelector(".bar");
    metaEl = shadow.querySelector(".meta");
    rowsEl = shadow.querySelector(".rows");
    chevEl = shadow.querySelector(".chev");

    bar.addEventListener("click", function () {
      clearTimers();
      setExpanded(!state.expanded);
    });
    bar.addEventListener("pointerdown", function () {
      clearTimers();
    });
    document.addEventListener("click", function (e) {
      if (!state.expanded) return;
      if (e.composedPath && e.composedPath().indexOf(host) !== -1) return;
      if (host.contains(e.target)) return;
      setExpanded(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && state.expanded) setExpanded(false);
    });
  }

  function setExpanded(expanded) {
    if (!frame) return;
    state.expanded = !!expanded;
    frame.setAttribute("data-state", expanded ? "expanded" : "collapsed");
    bar.setAttribute("aria-expanded", expanded ? "true" : "false");
    metaEl.textContent = expanded ? expandedMeta() : collapsedMeta();
    if (!expanded) {
      state.collapsedByUser = true;
      markSeen(state.key);
    }
  }

  function collapsedMeta() {
    if (state.stories.length) {
      return state.stories.length + (state.stories.length === 1 ? " signal" : " signals");
    }
    return "Today\u2019s signals";
  }

  function expandedMeta() {
    var parts = [];
    if (state.issue) parts.push(state.issue);
    if (state.date) parts.push(shortDate(state.date));
    return parts.join("  \u00b7  ") || "Today\u2019s signals";
  }

  function shortDate(d) {
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    try {
      return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
    } catch (e) {
      return d;
    }
  }

  function render(data) {
    if (!data || !data.stories.length) return;
    state.issue = data.issue || "";
    state.date = data.date || "";
    state.stories = data.stories;
    state.url = data.url || "";
    state.key = issueKey(data);

    shadow.querySelector(".issue").textContent = state.issue || "Today\u2019s signals";
    shadow.querySelector(".date").textContent = state.date ? shortDate(state.date) : "";

    var html = "";
    for (var i = 0; i < state.stories.length; i++) {
      var s = state.stories[i];
      var href = state.url
        ? state.url + (s.hash ? "#" + s.hash : "")
        : s.hash
        ? "#" + s.hash
        : state.url || "#";
      html +=
        '<a class="row" href="' + escapeAttr(href) + '">' +
        '<span class="n">' + escapeHtml(s.num || two(i + 1)) + "</span>" +
        "<span>" +
        '<span class="cat">' + escapeHtml(s.cat || s.label || "Signal") + "</span>" +
        '<span class="hl">' + escapeHtml(s.headline) + "</span>" +
        "</span></a>";
    }
    if (state.url) {
      html +=
        '<a class="cta" href="' + escapeAttr(state.url) + '">' +
        "Read the full issue<span>" + escapeHtml(state.issue || "") + "</span>" +
        '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
        '<path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "</a>";
    }
    rowsEl.innerHTML = html;

    metaEl.textContent = state.expanded ? expandedMeta() : collapsedMeta();
    frame.classList.add("in");

    if (forceOpen) {
      setExpanded(true);
      return;
    }
    if (!seen(state.key)) {
      if (reducedMotion) {
        markSeen(state.key);
        return;
      }
      // Engage like a live activity: expand shortly after launch, then settle.
      autoExpandTimer = setTimeout(function () {
        setExpanded(true);
        autoCollapseTimer = setTimeout(function () {
          if (!state.collapsedByUser) setExpanded(false);
        }, 8000);
      }, 750);
    }
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function clearTimers() {
    if (autoExpandTimer) clearTimeout(autoExpandTimer);
    if (autoCollapseTimer) clearTimeout(autoCollapseTimer);
    autoExpandTimer = autoCollapseTimer = null;
  }

  /* ── live push ───────────────────────────────────────────────── */

  function listenForPush() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.addEventListener("message", function (event) {
      var msg = event.data || {};
      if (msg.type !== "TIMPS_PUSH") return;
      var data = dataFromPush(msg.payload);
      if (!data || !data.stories.length) return;
      // A push is the strongest signal: always re-open and show it.
      forceOpen = true;
      state.collapsedByUser = false;
      state.fromPush = true;
      clearTimers();
      render(data);
      setExpanded(true);
    });
    navigator.serviceWorker.ready
      .then(function (reg) {
        if (reg.active) reg.active.postMessage({ type: "TIMPS_ISLAND_READY" });
      })
      .catch(function () {});
  }

  /* ── boot ────────────────────────────────────────────────────── */

  function watchInstallOverlay() {
    var overlay = document.getElementById("installOverlay");
    if (!overlay || !host) return;
    function sync() {
      var hidden =
        overlay.classList.contains("hidden") ||
        window.getComputedStyle(overlay).display === "none";
      host.style.display = hidden ? "flex" : "none";
    }
    try {
      new MutationObserver(sync).observe(overlay, {
        attributes: true,
        attributeFilter: ["class", "style"]
      });
    } catch (e) {}
    sync();
  }

  function registerWorker() {
    if (!("serviceWorker" in navigator) || window.location.protocol === "file:") return;
    var selfUrl = scriptEl && scriptEl.src
      ? scriptEl.src
      : new URL("assets/dynamic-island.js", window.location.href).href;
    var swUrl = new URL("../sw.js", selfUrl);
    var scope = new URL("../", selfUrl);
    navigator.serviceWorker
      .register(swUrl.href, { scope: scope.pathname, updateViaCache: "none" })
      .then(function (reg) {
        if (reg && reg.update) reg.update();
      })
      .catch(function () {});
  }

  function boot() {
    registerWorker();
    build();
    watchInstallOverlay();
    listenForPush();
    readLatestIssue().then(function (data) {
      // Never clobber a push that landed while the page was fetching.
      if (data && !state.fromPush) render(data);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
