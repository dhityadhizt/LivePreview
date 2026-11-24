// Default sample repository loaded on startup so the user can test immediately
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
  <title>Demo GitHub Pages Project</title>
  <link rel="stylesheet" href="./css/style.css" />
</head>
<body>
  <div class="card">
    <span class="badge">GitHub Pages Ready</span>
    <h1>Halo, Developer! 👋</h1>
    <p>Ubah kode di panel sebelah kiri atau import file <strong>.zip</strong> repositori GitHub Anda untuk melihat pratinjau real-time di Desktop, Android, dan iOS.</p>
    <div class="counter-box">
      <button id="btn-dec">−</button>
      <span id="count-val">0</span>
      <button id="btn-inc">+</button>
    </div>
    <p class="hint" id="device-info">Mendeteksi ukuran layar...</p>
  </div>
  <script src="./js/main.js"></script>
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
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  padding: 28px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
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
  font-size: 0.92rem;
  line-height: 1.5;
  margin-bottom: 20px;
}

.counter-box {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  background: #0f172a;
  padding: 8px 18px;
  border-radius: 12px;
  border: 1px solid #334155;
  margin-bottom: 16px;
}

.counter-box button {
  width: 34px;
  height: 34px;
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

.hint {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-bottom: 0;
}`
    },
    "js/main.js": {
      type: "text",
      content: `let count = 0;
const valEl = document.getElementById("count-val");
const infoEl = document.getElementById("device-info");

document.getElementById("btn-inc").addEventListener("click", () => {
  count++;
  valEl.textContent = count;
  console.log("Counter bertambah:", count);
});

document.getElementById("btn-dec").addEventListener("click", () => {
  count--;
  valEl.textContent = count;
  console.log("Counter berkurang:", count);
});

function updateViewportText() {
  infoEl.textContent = \`Viewport aktif: \${window.innerWidth}px × \${window.innerHeight}px\`;
}

window.addEventListener("resize", updateViewportText);
updateViewportText();`
    },
    "README.md": {
      type: "text",
      content: `# Sample GitHub Pages Repository

Proyek contoh ini mendemonstrasikan bagaimana **GitPreview IDE** membaca struktur folder, HTML, CSS, dan JavaScript lalu merendernya secara langsung.`
    }
  }
};
