window.SAMPLE_REPO = {
  repoName: "landing-page-demo-main",
  files: {
    "index.html": {
      type: "text",
      content: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Demo GitHub Pages Real SW Preview</title>
  <link rel="stylesheet" href="./css/style.css" />
</head>
<body>
  <div class="card">
    <span class="badge">Real HTTP Service Worker</span>
    <h1>Halo, Developer! 👋</h1>
    <p>Halaman ini disajikan lewat <strong>Service Worker Virtual Server</strong> asli sehingga URL, <code>fetch()</code>, ES Modules, <code>localStorage</code>, dan navigasi berjalan 100% persis seperti web terpublikasi.</p>
    <div class="counter-box">
      <button id="btn-dec">−</button>
      <span id="count-val">0</span>
      <button id="btn-inc">+</button>
    </div>
    <div id="json-status" class="json-box">Memuat ./data/config.json...</div>
    <div class="nav-links">
      <a href="./about.html" class="btn-link">Buka Halaman About.html →</a>
    </div>
    <p class="hint" id="device-info">Mendeteksi ukuran layar...</p>
  </div>
  <script type="module" src="./js/main.js"></script>
</body>
</html>`
    },
    "about.html": {
      type: "text",
      content: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>About — Demo Multi-Page</title>
  <link rel="stylesheet" href="./css/style.css" />
</head>
<body>
  <div class="card">
    <span class="badge">Multi-Page Navigation</span>
    <h1>Halaman Kedua (about.html)</h1>
    <p>Navigasi antar file HTML berjalan secara alami melalui protokol HTTP browser tanpa manipulasi DOM.</p>
    <div class="nav-links">
      <a href="./index.html" class="btn-link">← Kembali ke index.html</a>
    </div>
  </div>
</body>
</html>`
    },
    "css/style.css": {
      type: "text",
      content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f8fafc;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.card {
  background: rgba(30, 41, 59, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 22px;
  padding: 28px;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
}

.badge {
  display: inline-block;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  margin-bottom: 14px;
}

h1 {
  font-size: 1.6rem;
  margin-bottom: 10px;
}

p {
  color: #cbd5e1;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 18px;
}

.counter-box {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  background: #0f172a;
  padding: 8px 18px;
  border-radius: 12px;
  border: 1px solid #334155;
  margin-bottom: 14px;
}

.counter-box button {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: #10b981;
  color: #064e3b;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
}

.counter-box span {
  font-size: 1.25rem;
  font-weight: 700;
  min-width: 28px;
}

.json-box {
  background: rgba(15, 23, 42, 0.75);
  border: 1px dashed #334155;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.8rem;
  color: #38bdf8;
  margin-bottom: 14px;
}

.nav-links {
  margin-bottom: 14px;
}

.btn-link {
  display: inline-block;
  color: #34d399;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.hint {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-bottom: 0;
}

@media (max-width: 430px) {
  .card {
    padding: 20px;
    border-radius: 18px;
  }
  h1 {
    font-size: 1.32rem;
  }
}`
    },
    "js/helper.js": {
      type: "text",
      content: `export function formatViewport(w, h) {
  return \`Viewport nyata: \${w}px × \${h}px | Origin: \${location.origin}\`;
}`
    },
    "js/main.js": {
      type: "text",
      content: `import { formatViewport } from "./helper.js";

let count = Number(localStorage.getItem("demo_count") || 0);
const valEl = document.getElementById("count-val");
const infoEl = document.getElementById("device-info");
const jsonEl = document.getElementById("json-status");
valEl.textContent = count;

document.getElementById("btn-inc").addEventListener("click", () => {
  count++;
  valEl.textContent = count;
  localStorage.setItem("demo_count", count);
  console.log("Counter tersimpan ke localStorage:", count);
});

document.getElementById("btn-dec").addEventListener("click", () => {
  count--;
  valEl.textContent = count;
  localStorage.setItem("demo_count", count);
  console.log("Counter tersimpan ke localStorage:", count);
});

fetch("./data/config.json")
  .then((res) => res.json())
  .then((data) => {
    jsonEl.textContent = \`HTTP Fetch OK: \${data.project} v\${data.version}\`;
  })
  .catch((err) => {
    jsonEl.textContent = "Error: " + err.message;
  });

function updateViewportText() {
  infoEl.textContent = formatViewport(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", updateViewportText);
updateViewportText();`
    },
    "data/config.json": {
      type: "text",
      content: `{
  "project": "GitPreview Real Service Worker",
  "version": "3.0.0",
  "mode": "100% Native Browser HTTP"
}`
    },
    "README.md": {
      type: "text",
      content: `# GitPreview IDE v3 — Real Service Worker GitHub Pages Simulator

Menggunakan Service Worker (\`sw.js\`) untuk menyajikan seluruh isi repositori ZIP melalui path HTTP asli (\`/__preview__/\`), sehingga hasilnya 100% persis seperti saat sudah di-deploy menjadi website.`
    }
  }
};
