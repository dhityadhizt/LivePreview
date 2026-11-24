/* Service Worker Virtual Web Server for GitPreview IDE v3
 * Serves extracted GitHub repository files over real HTTP paths under /__preview__/
 * so relative URLs, fetch(), XHR, ES Modules, Workers, and History API behave identically to live GitHub Pages.
 */
const SW_VERSION = "gitpreview-sw-v3";
let vfsStore = new Map(); // path -> { buffer: ArrayBuffer, mime: string }

const MIME_MAP = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  mjs: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  mp4: "video/mp4",
  webm: "video/webm",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  webmanifest: "application/manifest+json; charset=utf-8"
};

function getMime(path) {
  const clean = path.split("?")[0].split("#")[0];
  const ext = clean.includes(".") ? clean.split(".").pop().toLowerCase() : "";
  return MIME_MAP[ext] || "application/octet-stream";
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SYNC_VFS") {
    vfsStore.clear();
    const entries = data.files || [];
    for (const item of entries) {
      vfsStore.set(item.path, {
        buffer: item.buffer,
        mime: item.mime || getMime(item.path)
      });
    }
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ ok: true, count: vfsStore.size });
    }
  } else if (data.type === "UPDATE_FILE") {
    vfsStore.set(data.path, {
      buffer: data.buffer,
      mime: data.mime || getMime(data.path)
    });
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ ok: true });
    }
  }
});

self.addEventListener("fetch", (event) => {
  const reqUrl = new URL(event.request.url);
  if (reqUrl.origin !== self.location.origin) return;

  // Determine base scope path (e.g., "/my-repo/" or "/")
  const scopeUrl = new URL(self.registration.scope);
  const scopePath = scopeUrl.pathname.endsWith("/") ? scopeUrl.pathname : scopeUrl.pathname + "/";
  const virtualPrefix = scopePath + "__preview__/";

  if (!reqUrl.pathname.startsWith(virtualPrefix)) return;

  let relPath = decodeURIComponent(reqUrl.pathname.slice(virtualPrefix.length));
  if (!relPath || relPath.endsWith("/")) {
    relPath += "index.html";
  }

  event.respondWith(
    (async () => {
      const fileEntry = vfsStore.get(relPath);
      if (!fileEntry) {
        // Fallback for SPA routing if 404.html exists in repo
        const custom404 = vfsStore.get("404.html");
        if (custom404 && event.request.mode === "navigate") {
          return new Response(custom404.buffer, {
            status: 404,
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
          });
        }
        return new Response(`404 Not Found in Virtual Repo: ${relPath}`, {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }

      const headers = {
        "Content-Type": fileEntry.mime,
        "Cache-Control": "no-store, no-cache, must-revalidate"
      };

      // Inject lightweight console/navigation telemetry only into HTML documents
      if (fileEntry.mime.startsWith("text/html")) {
        const decoder = new TextDecoder("utf-8");
        let html = decoder.decode(fileEntry.buffer);
        const hookScript = `<script>
(function(){
  const send = (type, payload) => {
    try { window.parent.postMessage({ source: "gitpreview-sw-client", type, ...payload }, "*"); } catch(e) {}
  };
  ["log","warn","error","info"].forEach(fn => {
    const orig = console[fn];
    console[fn] = function(...args) {
      send("console", { level: fn, messages: args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)) });
      orig.apply(console, args);
    };
  });
  window.addEventListener("error", e => send("console", { level: "error", messages: [e.message + (e.lineno ? " (line " + e.lineno + ")" : "")] }));
  window.addEventListener("load", () => send("navigated", { pathname: location.pathname }));
})();
</script>`;
        if (/<head[^>]*>/i.test(html)) {
          html = html.replace(/<head[^>]*>/i, (m) => m + "\n" + hookScript);
        } else {
          html = hookScript + "\n" + html;
        }
        return new Response(html, { status: 200, headers });
      }

      return new Response(fileEntry.buffer, { status: 200, headers });
    })()
  );
});
