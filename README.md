# GitPreview IDE — GitHub Repo & Real-Time Multi-Device Previewer

Aplikasi web statis siap host di **GitHub Pages** yang berfungsi untuk membaca, mengedit, dan mempratinjau repositori GitHub (`.zip`) secara real-time pada tampilan **Desktop**, **Android**, dan **iOS**.

## Struktur Folder
```text
gitpreview-ide/
├── index.html          # Antarmuka utama IDE & Multi-Device Previewer
├── css/
│   └── style.css       # Styling tema GitHub Dark & bingkai perangkat (Desktop, Android, iOS)
├── js/
│   ├── sampleRepo.js   # Proyek contoh bawaan untuk uji coba langsung
│   ├── bundler.js      # In-browser bundler (menggabungkan HTML, CSS, JS, & aset gambar)
│   └── app.js          # Logika File Explorer, Code Editor, ZIP Extractor, & Console Bridge
└── README.md           # Dokumentasi penggunaan & deploy ke GitHub Pages
```

## Cara Deploy ke GitHub Pages
1. Ekstrak file `gitpreview-ide.zip`.
2. Buat repositori baru di GitHub, lalu unggah seluruh isi folder `gitpreview-ide` (`index.html`, `css/`, `js/`, `README.md`) ke branch `main`.
3. Buka tab **Settings** → **Pages** pada repositori GitHub Anda.
4. Pada bagian **Build and deployment**, pilih **Deploy from a branch**, pilih branch `main` dan folder `/ (root)`, lalu klik **Save**.
5. Tunggu beberapa saat hingga URL GitHub Pages Anda aktif dan siap digunakan!
