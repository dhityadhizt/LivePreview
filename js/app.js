(() => {
  const state = {
    repoName: "sample-repo",
    files: {}, // path -> { type: 'text'|'binary', content?: string, buffer: ArrayBuffer, dataUrl?: string, size: number }
    activeFile: null,
    entryHtml: "index.html",
    device: "desktop",
    landscape: false,
    consoleLogs: [],
    renderTimer: null,
    swReady: false,
    swRegistration: null
  };

  const el = {
    zipUpload: document.getElementById("zip-upload"),
    dropzone: document.getElementById("dropzone"),
    btnLoadSample: document.getElementById("btn-load-sample"),
    btnExportZip: document.getElementById("btn-export-zip"),
    repoNameDisplay: document.getElementById("repo-name-display"),
    engineModeText: document.getElementById("engine-mode-text"),
    fileSearch: document.getElementById("file-search"),
    entryHtmlSelect: document.getElementById("entry-html-select"),
    fileTree: document.getElementById("file-tree"),
    fileCount: document.getElementById("file-count"),
    repoSize: document.getElementById("repo-size"),
    activeFilePath: document.getElementById("active-file-path"),
    fileLangBadge: document.getElementById("file-lang-badge"),
    unsavedDot: document.getElementById("unsaved-dot"),
    btnCopyCode: document.getElementById("btn-copy-code"),
    codeEditorWrapper: document.getElementById("code-editor-wrapper"),
    lineNumbers: document.getElementById("line-numbers"),
    codeHighlightPre: document.getElementById("code-highlight-pre"),
    codeHighlight: document.getElementById("code-highlight"),
    codeTextarea: document.getElementById("code-textarea"),
    assetViewer: document.getElementById("asset-viewer"),
    assetPreviewImg: document.getElementById("asset-preview-img"),
    assetPreviewAudio: document.getElementById("asset-preview-audio"),
    assetInfo: document.getElementById("asset-info"),
    deviceBtns: document.querySelectorAll(".device-btn"),
    previewStage: document.getElementById("preview-stage"),
    deviceScaleWrapper: document.getElementById("device-scale-wrapper"),
    deviceFrame: document.getElementById("device-frame"),
    chromeDesktop: document.getElementById("chrome-desktop"),
    chromeAndroid: document.getElementById("chrome-android"),
    chromeIos: document.getElementById("chrome-ios"),
    navAndroid: document.getElementById("nav-android"),
    navIos: document.getElementById("nav-ios"),
    viewportDimensions: document.getElementById("viewport-dimensions"),
    zoomBadge: document.getElementById("zoom-badge"),
    previewUrlBar: document.getElementById("preview-url-bar"),
    btnOpenNewTab: document.getElementById("btn-open-newtab"),
    btnRotate: document.getElementById("btn-rotate"),
    btnRefreshPreview: document.getElementById("btn-refresh-preview"),
    previewIframe: document.getElementById("preview-iframe"),
    btnToggleConsole: document.getElementById("btn-toggle-console"),
    consolePanel: document.getElementById("console-panel"),
    consoleBadge: document.getElementById("console-badge"),
    toast: document.getElementById("toast")
  };

  const encoder = new TextEncoder();
  const TEXT_EXTENSIONS = new Set([
    "html", "htm", "css", "scss", "js", "mjs", "jsx", "ts", "tsx",
    "json", "md", "txt", "svg", "xml", "yml", "yaml", "csv", "env", "gitignore"
  ]);

  function isTextFile(filename) {
    const base = filename.split("/").pop().toLowerCase();
    if (base === "license" || base === "readme" || base.startsWith(".")) return true;
    const ext = base.includes(".") ? base.split(".").pop() : "";
    return TEXT_EXTENSIONS.has(ext);
  }

  function getMimeType(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    const map = {
      html: "text/html; charset=utf-8",
      htm: "text/html; charset=utf-8",
      css: "text/css; charset=utf-8",
      js: "application/javascript; charset=utf-8",
      mjs: "application/javascript; charset=utf-8",
      json: "application/json; charset=utf-8",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      ico: "image/x-icon",
      mp3: "audio/mpeg",
      ogg: "audio/ogg",
      wav: "audio/wav",
      mp4: "video/mp4",
      webm: "video/webm",
      woff: "font/woff",
      woff2: "font/woff2",
      ttf: "font/ttf",
      otf: "font/otf"
    };
    return map[ext] || "application/octet-stream";
  }

  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.remove("opacity-0");
    setTimeout(() => el.toast.classList.add("opacity-0"), 2400);
  }

  // Register Service Worker for Real HTTP Virtual Web Hosting
  async function initServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") {
      state.swReady = false;
      el.engineModeText.textContent = "Fallback Mode (file://)";
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register("./sw.js");
      state.swRegistration = reg;

      if (reg.installing) {
        await new Promise((resolve) => {
          reg.installing.addEventListener("statechange", (e) => {
            if (e.target.state === "activated") resolve();
          });
        });
      }
      await navigator.serviceWorker.ready;
      state.swReady = true;
      el.engineModeText.textContent = "Real HTTP SW Active";
    } catch (err) {
      console.warn("SW fallback:", err);
      state.swReady = false;
      el.engineModeText.textContent = "Fallback Bundle Mode";
    }
  }

  function sendSwMessage(payload) {
    return new Promise((resolve) => {
      const worker = navigator.serviceWorker.controller || (state.swRegistration && state.swRegistration.active);
      if (!worker) {
        resolve(false);
        return;
      }
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve(true);
      worker.postMessage(payload, [channel.port2]);
      setTimeout(() => resolve(true), 400);
    });
  }

  async function syncAllFilesToSw() {
    if (!state.swReady) return;
    const filesPayload = Object.entries(state.files).map(([path, f]) => ({
      path,
      buffer: f.buffer,
      mime: getMimeType(path)
    }));
    await sendSwMessage({ type: "SYNC_VFS", files: filesPayload });
  }

  async function syncSingleFileToSw(path) {
    if (!state.swReady || !state.files[path]) return;
    await sendSwMessage({
      type: "UPDATE_FILE",
      path,
      buffer: state.files[path].buffer,
      mime: getMimeType(path)
    });
  }

  function getPreviewHttpUrl(entryPath) {
    const baseDir = location.pathname.endsWith("/")
      ? location.pathname
      : location.pathname.slice(0, location.pathname.lastIndexOf("/") + 1);
    return `${location.origin}${baseDir}__preview__/${entryPath || "index.html"}`;
  }

  async function loadSampleRepo() {
    state.repoName = window.SAMPLE_REPO.repoName;
    state.files = {};
    for (const [path, fileObj] of Object.entries(window.SAMPLE_REPO.files)) {
      const buf = encoder.encode(fileObj.content).buffer;
      state.files[path] = {
        ...fileObj,
        buffer: buf,
        size: buf.byteLength
      };
    }
    await onRepoLoaded();
    showToast("Contoh repositori dimuat!");
  }

  async function handleZipFile(file) {
    if (!file || !file.name.endsWith(".zip")) {
      showToast("Harap pilih file berformat .zip dari GitHub!");
      return;
    }

    try {
      const zip = await JSZip.loadAsync(file);
      const rawEntries = [];

      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && !relativePath.includes("__MACOSX/")) {
          rawEntries.push({ relativePath, zipEntry });
        }
      });

      if (rawEntries.length === 0) {
        showToast("File ZIP kosong!");
        return;
      }

      const firstSegments = new Set(rawEntries.map((e) => e.relativePath.split("/")[0]));
      const hasSingleRoot = firstSegments.size === 1 && rawEntries.every((e) => e.relativePath.includes("/"));
      const rootFolder = hasSingleRoot ? [...firstSegments][0] : file.name.replace(/\.zip$/i, "");

      state.repoName = rootFolder;
      state.files = {};

      for (const { relativePath, zipEntry } of rawEntries) {
        const cleanPath = hasSingleRoot
          ? relativePath.slice(rootFolder.length + 1)
          : relativePath;

        if (!cleanPath) continue;

        const arrayBuf = await zipEntry.async("arraybuffer");

        if (isTextFile(cleanPath)) {
          const text = new TextDecoder("utf-8").decode(arrayBuf);
          const isSvg = cleanPath.toLowerCase().endsWith(".svg");
          state.files[cleanPath] = {
            type: "text",
            content: text,
            buffer: arrayBuf,
            dataUrl: isSvg ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(text) : null,
            size: arrayBuf.byteLength
          };
        } else {
          const base64 = await zipEntry.async("base64");
          const mime = getMimeType(cleanPath);
          state.files[cleanPath] = {
            type: "binary",
            buffer: arrayBuf,
            dataUrl: `data:${mime};base64,${base64}`,
            size: arrayBuf.byteLength
          };
        }
      }

      await onRepoLoaded();
      showToast(`Berhasil memuat ${Object.keys(state.files).length} file dari ZIP!`);
    } catch (err) {
      console.error(err);
      showToast("Gagal mengekstrak file ZIP.");
    }
  }

  async function onRepoLoaded() {
    el.repoNameDisplay.textContent = state.repoName;
    const paths = Object.keys(state.files).sort();

    const htmlFiles = paths.filter((p) => p.toLowerCase().endsWith(".html") || p.toLowerCase().endsWith(".htm"));
    el.entryHtmlSelect.innerHTML = "";
    if (htmlFiles.length > 0) {
      htmlFiles.forEach((h) => {
        const opt = document.createElement("option");
        opt.value = h;
        opt.textContent = h;
        el.entryHtmlSelect.appendChild(opt);
      });
      state.entryHtml = htmlFiles.includes("index.html") ? "index.html" : htmlFiles[0];
      el.entryHtmlSelect.value = state.entryHtml;
    } else {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "(Tidak ada HTML)";
      el.entryHtmlSelect.appendChild(opt);
      state.entryHtml = "";
    }

    const totalBytes = Object.values(state.files).reduce((acc, f) => acc + (f.size || 0), 0);
    el.fileCount.textContent = `${paths.length} files`;
    el.repoSize.textContent = `${(totalBytes / 1024).toFixed(1)} KB`;

    renderFileTree();
    await syncAllFilesToSw();

    const initialFile = state.entryHtml || paths[0];
    if (initialFile) openFile(initialFile);
    updatePreview();
  }

  function renderFileTree(filterQuery = "") {
    const q = filterQuery.trim().toLowerCase();
    const paths = Object.keys(state.files)
      .filter((p) => !q || p.toLowerCase().includes(q))
      .sort((a, b) => {
        const aDepth = a.split("/").length;
        const bDepth = b.split("/").length;
        if (aDepth !== bDepth) return aDepth - bDepth;
        return a.localeCompare(b);
      });

    el.fileTree.innerHTML = "";
    const renderedFolders = new Set();

    paths.forEach((filePath) => {
      const parts = filePath.split("/");
      for (let i = 0; i < parts.length - 1; i++) {
        const folderPath = parts.slice(0, i + 1).join("/");
        if (!renderedFolders.has(folderPath)) {
          renderedFolders.add(folderPath);
          const folderEl = document.createElement("div");
          folderEl.style.paddingLeft = `${i * 12 + 6}px`;
          folderEl.className = "flex items-center gap-1.5 py-1 text-[#8b949e] select-none";
          folderEl.innerHTML = `<i data-lucide="folder" class="w-3.5 h-3.5 text-sky-400 shrink-0"></i><span class="truncate">${parts[i]}</span>`;
          el.fileTree.appendChild(folderEl);
        }
      }

      const fileName = parts[parts.length - 1];
      const depth = parts.length - 1;
      const btn = document.createElement("button");
      btn.style.paddingLeft = `${depth * 12 + 8}px`;
      btn.className = `tree-file w-full text-left flex items-center gap-1.5 py-1 pr-2 rounded hover:bg-[#21262d] text-[#c9d1d9] transition ${
        state.activeFile === filePath ? "active" : ""
      }`;

      const iconColor = getFileIconColor(fileName);
      btn.innerHTML = `<i data-lucide="file-text" class="w-3.5 h-3.5 ${iconColor} shrink-0"></i><span class="truncate">${fileName}</span>`;
      btn.addEventListener("click", () => openFile(filePath));
      el.fileTree.appendChild(btn);
    });

    lucide.createIcons();
  }

  function getFileIconColor(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    if (ext === "html" || ext === "htm") return "text-orange-400";
    if (ext === "css" || ext === "scss") return "text-sky-400";
    if (ext === "js" || ext === "ts" || ext === "mjs") return "text-yellow-400";
    if (ext === "json") return "text-emerald-400";
    if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return "text-purple-400";
    return "text-[#8b949e]";
  }

  function openFile(filePath) {
    const fileObj = state.files[filePath];
    if (!fileObj) return;

    state.activeFile = filePath;
    el.activeFilePath.textContent = filePath;
    const ext = filePath.includes(".") ? filePath.split(".").pop().toUpperCase() : "TXT";
    el.fileLangBadge.textContent = ext;

    renderFileTree(el.fileSearch.value);

    if (fileObj.type === "text") {
      el.assetViewer.classList.add("hidden");
      el.assetViewer.classList.remove("flex");
      el.codeEditorWrapper.classList.remove("hidden");

      el.codeTextarea.value = fileObj.content;
      syncEditorHighlight();
    } else {
      el.codeEditorWrapper.classList.add("hidden");
      el.assetViewer.classList.remove("hidden");
      el.assetViewer.classList.add("flex");

      const isAudio = fileObj.dataUrl && fileObj.dataUrl.startsWith("data:audio/");
      el.assetPreviewImg.classList.toggle("hidden", isAudio);
      el.assetPreviewAudio.classList.toggle("hidden", !isAudio);

      if (isAudio) {
        el.assetPreviewAudio.src = fileObj.dataUrl;
      } else {
        el.assetPreviewImg.src = fileObj.dataUrl;
      }
      el.assetInfo.textContent = `${filePath} • ${(fileObj.size / 1024).toFixed(1)} KB`;
    }
  }

  function syncEditorHighlight() {
    const code = el.codeTextarea.value;
    const ext = state.activeFile ? state.activeFile.split(".").pop().toLowerCase() : "html";
    const langMap = { htm: "html", js: "javascript", mjs: "javascript", ts: "typescript", md: "markdown", yml: "yaml" };
    const lang = langMap[ext] || ext;

    el.codeHighlight.className = `language-${lang}`;
    el.codeHighlight.textContent = code + (code.endsWith("\n") ? " " : "");
    if (window.hljs) {
      delete el.codeHighlight.dataset.highlighted;
      hljs.highlightElement(el.codeHighlight);
    }

    const lines = code.split("\n").length;
    el.lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("<br>");
  }

  function schedulePreviewUpdate() {
    el.unsavedDot.classList.remove("hidden");
    clearTimeout(state.renderTimer);
    state.renderTimer = setTimeout(async () => {
      if (state.activeFile) {
        await syncSingleFileToSw(state.activeFile);
      }
      updatePreview();
      el.unsavedDot.classList.add("hidden");
    }, 250);
  }

  function updatePreview() {
    clearConsole();
    if (state.swReady) {
      const targetUrl = getPreviewHttpUrl(state.entryHtml);
      el.previewUrlBar.textContent = targetUrl;
      el.previewIframe.removeAttribute("srcdoc");
      // Force reload even if path is identical
      if (el.previewIframe.src === targetUrl && el.previewIframe.contentWindow) {
        el.previewIframe.contentWindow.location.reload();
      } else {
        el.previewIframe.src = targetUrl;
      }
    } else {
      el.previewUrlBar.textContent = `fallback://${state.repoName}/${state.entryHtml}`;
      el.previewIframe.srcdoc = window.FallbackBundler.buildHtmlDocument(state.entryHtml, state.files);
    }
  }

  function updateDeviceScale() {
    if (state.device === "desktop") {
      el.deviceScaleWrapper.style.width = "100%";
      el.deviceScaleWrapper.style.height = "100%";
      el.deviceScaleWrapper.style.transform = "scale(1)";
      el.zoomBadge.textContent = "Scale 100%";
      return;
    }

    el.deviceScaleWrapper.style.width = "auto";
    el.deviceScaleWrapper.style.height = "auto";

    const stageRect = el.previewStage.getBoundingClientRect();
    const availW = Math.max(stageRect.width - 32, 200);
    const availH = Math.max(stageRect.height - 32, 200);

    const targetW = state.device === "ios"
      ? (state.landscape ? 876 : 417)
      : (state.landscape ? 937 : 434);
    const targetH = state.device === "ios"
      ? (state.landscape ? 417 : 876)
      : (state.landscape ? 434 : 937);

    const scale = Math.min(1, availW / targetW, availH / targetH);
    el.deviceScaleWrapper.style.transform = `scale(${scale.toFixed(3)})`;
    el.zoomBadge.textContent = `Scale ${Math.round(scale * 100)}%`;
  }

  function setDevice(device) {
    state.device = device;
    el.deviceBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.device === device);
      if (btn.dataset.device !== device) {
        btn.classList.add("text-[#8b949e]");
      } else {
        btn.classList.remove("text-[#8b949e]");
      }
    });

    el.chromeDesktop.classList.toggle("hidden", device !== "desktop");
    el.chromeAndroid.classList.toggle("hidden", device !== "android");
    el.navAndroid.classList.toggle("hidden", device !== "android");
    el.chromeIos.classList.toggle("hidden", device !== "ios");
    el.navIos.classList.toggle("hidden", device !== "ios");

    el.btnRotate.disabled = device === "desktop";
    applyDeviceFrameClasses();
  }

  function applyDeviceFrameClasses() {
    el.deviceFrame.className = `device-${state.device} transition-all duration-300 shadow-2xl flex flex-col bg-white overflow-hidden`;
    if (state.device !== "desktop" && state.landscape) {
      el.deviceFrame.classList.add("landscape");
    }

    if (state.device === "desktop") {
      el.viewportDimensions.textContent = "Desktop 100%";
    } else if (state.device === "android") {
      el.viewportDimensions.textContent = state.landscape ? "915 × 412 (Android)" : "412 × 915 (Android)";
    } else if (state.device === "ios") {
      el.viewportDimensions.textContent = state.landscape ? "852 × 393 (iOS)" : "393 × 852 (iOS)";
    }

    updateDeviceScale();
  }

  function clearConsole() {
    state.consoleLogs = [];
    el.consoleBadge.textContent = "0";
    el.consolePanel.innerHTML = '<div class="text-[#6e7681]">// Log console dari pratinjau akan muncul di sini...</div>';
  }

  window.addEventListener("message", (event) => {
    if (!event.data || event.data.source !== "gitpreview-sw-client") return;

    if (event.data.type === "console") {
      if (state.consoleLogs.length === 0) el.consolePanel.innerHTML = "";
      state.consoleLogs.push(event.data);
      el.consoleBadge.textContent = String(state.consoleLogs.length);

      const line = document.createElement("div");
      const color =
        event.data.level === "error"
          ? "text-rose-400"
          : event.data.level === "warn"
          ? "text-amber-400"
          : "text-emerald-300";
      line.className = `${color} border-b border-[#21262d] pb-0.5`;
      line.textContent = `[${event.data.level.toUpperCase()}] ${event.data.messages.join(" ")}`;
      el.consolePanel.appendChild(line);
      el.consolePanel.scrollTop = el.consolePanel.scrollHeight;
    } else if (event.data.type === "navigated" && event.data.pathname) {
      const marker = "/__preview__/";
      const idx = event.data.pathname.indexOf(marker);
      if (idx !== -1) {
        const relPath = decodeURIComponent(event.data.pathname.slice(idx + marker.length));
        if (state.files[relPath]) {
          state.entryHtml = relPath;
          el.entryHtmlSelect.value = relPath;
          el.previewUrlBar.textContent = `${location.origin}${event.data.pathname}`;
          openFile(relPath);
        }
      }
    }
  });

  async function exportProjectZip() {
    const zip = new JSZip();
    for (const [path, fileObj] of Object.entries(state.files)) {
      if (fileObj.type === "text") {
        zip.file(path, fileObj.content);
      } else {
        zip.file(path, fileObj.buffer);
      }
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.repoName}-edited.zip`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("File ZIP berhasil diunduh!");
  }

  // Event Listeners
  el.zipUpload.addEventListener("change", (e) => handleZipFile(e.target.files[0]));
  el.dropzone.addEventListener("click", () => el.zipUpload.click());
  el.dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.dropzone.classList.add("border-emerald-500", "bg-emerald-500/10");
  });
  el.dropzone.addEventListener("dragleave", () => {
    el.dropzone.classList.remove("border-emerald-500", "bg-emerald-500/10");
  });
  el.dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    el.dropzone.classList.remove("border-emerald-500", "bg-emerald-500/10");
    if (e.dataTransfer.files.length) handleZipFile(e.dataTransfer.files[0]);
  });

  el.btnLoadSample.addEventListener("click", loadSampleRepo);
  el.btnExportZip.addEventListener("click", exportProjectZip);
  el.fileSearch.addEventListener("input", (e) => renderFileTree(e.target.value));

  el.entryHtmlSelect.addEventListener("change", (e) => {
    state.entryHtml = e.target.value;
    updatePreview();
  });

  el.codeTextarea.addEventListener("input", () => {
    if (state.activeFile && state.files[state.activeFile]) {
      const val = el.codeTextarea.value;
      const buf = encoder.encode(val).buffer;
      state.files[state.activeFile].content = val;
      state.files[state.activeFile].buffer = buf;
      state.files[state.activeFile].size = buf.byteLength;
      syncEditorHighlight();
      schedulePreviewUpdate();
    }
  });

  el.codeTextarea.addEventListener("scroll", () => {
    el.codeHighlightPre.scrollTop = el.codeTextarea.scrollTop;
    el.codeHighlightPre.scrollLeft = el.codeTextarea.scrollLeft;
    el.lineNumbers.scrollTop = el.codeTextarea.scrollTop;
  });

  el.codeTextarea.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = el.codeTextarea.selectionStart;
      const end = el.codeTextarea.selectionEnd;
      el.codeTextarea.value =
        el.codeTextarea.value.substring(0, start) + "  " + el.codeTextarea.value.substring(end);
      el.codeTextarea.selectionStart = el.codeTextarea.selectionEnd = start + 2;
      el.codeTextarea.dispatchEvent(new Event("input"));
    }
  });

  el.btnCopyCode.addEventListener("click", () => {
    navigator.clipboard.writeText(el.codeTextarea.value);
    showToast("Kode disalin ke clipboard!");
  });

  el.deviceBtns.forEach((btn) => {
    btn.addEventListener("click", () => setDevice(btn.dataset.device));
  });

  el.btnOpenNewTab.addEventListener("click", () => {
    if (state.swReady) {
      window.open(getPreviewHttpUrl(state.entryHtml), "_blank");
    } else {
      showToast("Deploy ke GitHub Pages / localhost agar fitur buka di tab baru aktif.");
    }
  });

  el.btnRotate.addEventListener("click", () => {
    state.landscape = !state.landscape;
    applyDeviceFrameClasses();
  });

  el.btnRefreshPreview.addEventListener("click", async () => {
    await syncAllFilesToSw();
    updatePreview();
    showToast("Pratinjau diperbarui!");
  });

  el.btnToggleConsole.addEventListener("click", () => {
    el.consolePanel.classList.toggle("hidden");
  });

  window.addEventListener("resize", updateDeviceScale);

  // Boot Sequence
  (async () => {
    lucide.createIcons();
    await initServiceWorker();
    await loadSampleRepo();
    setDevice("desktop");
  })();
})();
