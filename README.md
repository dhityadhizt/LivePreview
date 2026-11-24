# GitPreview IDE v3 — Real Service Worker GitHub Pages Simulator

Menggunakan **Service Worker Virtual Server (`sw.js`)** yang menyajikan file hasil ekstraksi ZIP melalui jalur HTTP asli (`/__preview__/index.html`), sehingga seluruh perilaku web (`window.location`, `localStorage`, `fetch`, `XMLHttpRequest`, ES Modules, Web Workers, navigasi multi-halaman) berjalan **100% persis seperti web terpublikasi di GitHub Pages**.

## Struktur File
```text
gitpreview-ide-v3/
├── index.html               # UI IDE & Multi-Device Previewer
├── sw.js                    # Service Worker HTTP Virtual Server
├── css/
│   └── style.css            # Styling tema GitHub Dark & dimensi viewport perangkat
├── js/
│   ├── sampleRepo.js        # Proyek contoh multi-halaman & localStorage
│   ├── fallbackBundler.js   # Cadangan jika dibuka langsung via file://
│   └── app.js               # Pengelola ZIP, Editor, SW Sync, & Device Viewport
└── README.md
```

## Cara Menjalankan
1. **Di GitHub Pages (Direkomendasikan)**: Unggah seluruh isi folder `gitpreview-ide-v3` ke repositori GitHub dan aktifkan **GitHub Pages**. `sw.js` akan otomatis aktif dan melayani pratinjau lewat HTTPS asli.
2. **Di Lokal**: Jalankan melalui HTTP server lokal (misalnya `npx serve .` atau VS Code Live Server) agar Service Worker aktif.
