/* Chatnode embed loader. Usage:
   <script src="https://host/embed.js" data-bot="BOT_ID" data-color="#1c69d4" defer></script>
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
  var side = script.getAttribute("data-position") === "left" ? "left" : "right";

  var chatIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var closeIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var frame = document.createElement("iframe");
  frame.title = "Chat";
  frame.style.cssText =
    "position:fixed;bottom:92px;" + side + ":20px;" +
    "width:min(400px,calc(100vw - 40px));height:min(640px,calc(100dvh - 120px));" +
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
  btn.setAttribute("aria-label", "Open chat");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = chatIcon;
  btn.style.cssText =
    "position:fixed;bottom:20px;" + side + ":20px;width:56px;height:56px;border:0;" +
    "border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
    "background:" + color + ";box-shadow:0 8px 24px rgba(0,0,0,.22);z-index:2147483001;transition:transform .15s ease;";
  btn.onmouseenter = function () { btn.style.transform = "scale(1.06)"; };
  btn.onmouseleave = function () { btn.style.transform = "scale(1)"; };

  var open = false;
  btn.onclick = function () {
    open = !open;
    if (open) loadFrame();
    frame.style.display = open ? "block" : "none";
    btn.innerHTML = open ? closeIcon : chatIcon;
    btn.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    btn.setAttribute("aria-expanded", String(open));
  };

  function mount() { document.body.appendChild(frame); document.body.appendChild(btn); }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();