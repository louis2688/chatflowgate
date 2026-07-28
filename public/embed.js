/* Chatnode embed loader. Usage:
   <script src="https://host/embed.js" data-bot="BOT_ID" data-color="#1c69d4" defer></script>
   Optional: data-position, data-width, data-height, data-button-text, data-greeting.
   Mints an origin-validated session in the PARENT context (so the bot's domain
   allowlist is enforced), then hands the token to the widget iframe via #hash. */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) return;
  var host = new URL(script.src).origin;
  var botId = script.getAttribute("data-bot");
  if (!botId) { console.error("[Chatnode] missing data-bot attribute"); return; }
  var color = script.getAttribute("data-color") || "#1c69d4";
  var buttonText = script.getAttribute("data-button-text") || "";
  var greeting = script.getAttribute("data-greeting") || "";
  // Accepts "left"/"right" (legacy) and the four corners the dashboard emits.
  var pos = (script.getAttribute("data-position") || "bottom-right").toLowerCase();
  var side = pos.indexOf("left") !== -1 ? "left" : "right";
  var vert = pos.indexOf("top") !== -1 ? "top" : "bottom";
  // Panel size, clamped to the range the dashboard allows.
  function px(name, dflt, lo, hi) {
    var v = parseInt(script.getAttribute(name) || "", 10);
    return isFinite(v) && v >= lo && v <= hi ? v : dflt;
  }
  var w = px("data-width", 400, 280, 600);
  var h = px("data-height", 640, 320, 900);

  // Readable text/icon colour for the launcher (YIQ; the widget itself does full WCAG).
  var m = /^#?([0-9a-f]{6})$/i.exec(color);
  var fg = "#ffffff";
  if (m) {
    var v = parseInt(m[1], 16);
    if (0.299 * (v >> 16 & 255) + 0.587 * (v >> 8 & 255) + 0.114 * (v & 255) > 150) fg = "#111111";
  }

  function icon(d) {
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + fg + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }
  var chatIcon = icon("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z");
  var closeIcon = icon("M6 6l12 12M18 6L6 18");

  // Phones get a fullscreen panel, desktops a floating one -- the behaviour
  // every established chat widget has. Expressed as a media query rather than
  // measured in JS so rotation, resize and the on-screen keyboard are handled
  // by the browser with no listeners. !important because the base rules below
  // are inline styles, which otherwise win.
  var MOBILE_MAX = 640; // keep in sync with BotEditor's MOBILE_BREAKPOINT
  var style = document.createElement("style");
  style.textContent =
    "@media (max-width:" + MOBILE_MAX + "px){" +
    ".chatnode-frame{top:0!important;left:0!important;right:0!important;bottom:0!important;" +
    "width:100vw!important;height:100vh!important;height:100dvh!important;" +
    "border-radius:0!important;box-shadow:none!important}" +
    // The panel covers the screen, so the launcher under it is an invisible
    // tap target. The widget header's own minimize button is the way back out.
    ".chatnode-launcher[data-open='true']{display:none!important}" +
    "}";
  document.head.appendChild(style);

  var frame = document.createElement("iframe");
  frame.title = "Chat";
  frame.className = "chatnode-frame";
  frame.style.cssText =
    "position:fixed;" + vert + ":92px;" + side + ":20px;" +
    "width:min(" + w + "px,calc(100vw - 40px));height:min(" + h + "px,calc(100dvh - 120px));" +
    "border:0;border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.28);" +
    "z-index:2147483000;display:none;background:#fff;";

  var loaded = false;
  function loadFrame() {
    if (loaded) return;
    loaded = true;
    // Mint a token from here (parent origin is sent automatically and checked).
    fetch(host + "/api/session/" + encodeURIComponent(botId), { method: "POST" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var hash = d && d.token ? "#t=" + encodeURIComponent(d.token) : "";
        frame.src = host + "/widget/" + encodeURIComponent(botId) + hash;
      })
      .catch(function () { frame.src = host + "/widget/" + encodeURIComponent(botId); });
  }

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chatnode-launcher";
  btn.style.cssText =
    "position:fixed;" + vert + ":20px;" + side + ":20px;height:56px;border:0;cursor:pointer;" +
    "display:flex;align-items:center;justify-content:center;gap:8px;" +
    "background:" + color + ";box-shadow:0 8px 24px rgba(0,0,0,.22);z-index:2147483001;transition:transform .15s ease;";
  btn.onmouseenter = function () { btn.style.transform = "scale(1.06)"; };
  btn.onmouseleave = function () { btn.style.transform = "scale(1)"; };

  // Greeting bubble, shown next to the launcher while the chat is closed.
  var bubble = null;
  if (greeting) {
    bubble = document.createElement("div");
    bubble.style.cssText =
      "position:fixed;" + vert + ":88px;" + side + ":20px;max-width:240px;" +
      "background:#fff;color:#111;border:1px solid #e5e5e5;border-radius:12px;" +
      "padding:10px 12px;font:13px/1.45 system-ui,sans-serif;" +
      "box-shadow:0 8px 24px rgba(0,0,0,.14);z-index:2147483001;";
    bubble.textContent = greeting;
  }

  var open = false;
  function render() {
    frame.style.display = open ? "block" : "none";
    if (bubble) bubble.style.display = open ? "none" : "block";
    if (!open && buttonText) {
      btn.style.width = "auto";
      btn.style.padding = "0 18px";
      btn.style.borderRadius = "28px";
      btn.innerHTML = chatIcon;
      var label = document.createElement("span");
      label.style.cssText = "color:" + fg + ";font:600 14px/1 system-ui,sans-serif;white-space:nowrap;";
      label.textContent = buttonText;
      btn.appendChild(label);
    } else {
      btn.style.width = "56px";
      btn.style.padding = "0";
      btn.style.borderRadius = "50%";
      btn.innerHTML = open ? closeIcon : chatIcon;
    }
    btn.setAttribute("aria-label", open ? "Close chat" : buttonText || "Open chat");
    btn.setAttribute("aria-expanded", String(open));
    // Drives the fullscreen stylesheet rule above.
    btn.setAttribute("data-open", open ? "true" : "false");
  }

  btn.onclick = function () {
    open = !open;
    if (open) loadFrame();
    render();
  };

  // The widget can ask to be closed from its own header. Only trust messages
  // coming from the Chatnode origin that serves this script.
  window.addEventListener("message", function (e) {
    if (e.origin !== host) return;
    if (!e.data || e.data.type !== "chatnode:minimize") return;
    open = false;
    render();
  });

  function mount() {
    document.body.appendChild(frame);
    if (bubble) document.body.appendChild(bubble);
    document.body.appendChild(btn);
    render();
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
