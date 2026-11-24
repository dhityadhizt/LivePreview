/**
 * In-Browser Multi-File Bundler for GitPreview IDE
 * Resolves relative paths (./, ../, root) for CSS, JS, and binary/image assets
 * so multi-file GitHub repositories render accurately inside an iframe srcdoc.
 */
window.RepoBundler = {
  resolvePath(baseFile, relativePath) {
    if (!relativePath) return null;
    // Ignore external URLs, data URIs, anchors, mailto, tel
    if (/^(https?:)?\/\//i.test(relativePath) || /^(data:|blob:|mailto:|tel:|#)/i.test(relativePath)) {
      return null;
    }

    const cleanRel = relativePath.split("?")[0].split("#")[0];
    if (cleanRel.startsWith("/")) {
      return cleanRel.replace(/^\/+/, "");
    }

    const baseParts = baseFile.split("/");
    baseParts.pop(); // remove current filename

    const relParts = cleanRel.split("/");
    for (const part of relParts) {
      if (part === "." || part === "") continue;
      if (part === "..") {
        baseParts.pop();
      } else {
        baseParts.push(part);
      }
    }
    return baseParts.join("/");
  },

  rewriteCssUrls(cssText, cssFilePath, filesMap) {
    return cssText.replace(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/gi, (match, rawUrl) => {
      const resolved = this.resolvePath(cssFilePath, rawUrl.trim());
      if (resolved && filesMap[resolved] && filesMap[resolved].dataUrl) {
        return `url("${filesMap[resolved].dataUrl}")`;
      }
      return match;
    });
  },

  buildHtmlDocument(entryPath, filesMap) {
    const entryFile = filesMap[entryPath];
    if (!entryFile || entryFile.type !== "text") {
      return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;color:#333;">
        <h2>File HTML tidak ditemukan</h2>
        <p>Pastikan repositori memiliki file <code>index.html</code> atau pilih file HTML pada dropdown <strong>Entry HTML</strong> di sidebar kiri.</p>
      </body></html>`;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(entryFile.content, "text/html");

    // 1. Inline local <link rel="stylesheet" href="...">
    doc.querySelectorAll('link[rel="stylesheet"]').forEach((linkEl) => {
      const href = linkEl.getAttribute("href");
      const resolved = this.resolvePath(entryPath, href);
      if (resolved && filesMap[resolved] && filesMap[resolved].type === "text") {
        const styleEl = doc.createElement("style");
        styleEl.setAttribute("data-source", resolved);
        styleEl.textContent = this.rewriteCssUrls(filesMap[resolved].content, resolved, filesMap);
        linkEl.replaceWith(styleEl);
      }
    });

    // 2. Rewrite inline <style> url(...) references
    doc.querySelectorAll("style").forEach((styleEl) => {
      styleEl.textContent = this.rewriteCssUrls(styleEl.textContent, entryPath, filesMap);
    });

    // 3. Replace local asset sources (img, source, video, audio) with Data URLs
    doc.querySelectorAll("[src]").forEach((el) => {
      if (el.tagName.toLowerCase() === "script") return;
      const src = el.getAttribute("src");
      const resolved = this.resolvePath(entryPath, src);
      if (resolved && filesMap[resolved] && filesMap[resolved].dataUrl) {
        el.setAttribute("src", filesMap[resolved].dataUrl);
      }
    });

    // 4. Inline local <script src="...">
    doc.querySelectorAll("script[src]").forEach((scriptEl) => {
      const src = scriptEl.getAttribute("src");
      const resolved = this.resolvePath(entryPath, src);
      if (resolved && filesMap[resolved] && filesMap[resolved].type === "text") {
        const inlineScript = doc.createElement("script");
        if (scriptEl.type) inlineScript.type = scriptEl.type;
        inlineScript.setAttribute("data-source", resolved);
        inlineScript.textContent = filesMap[resolved].content;
        scriptEl.replaceWith(inlineScript);
      }
    });

    // 5. Inject Console Bridge so console.log/warn/error appears in GitPreview Console
    const consoleBridge = doc.createElement("script");
    consoleBridge.textContent = `
      (function() {
        const send = (level, args) => {
          try {
            window.parent.postMessage({
              source: "gitpreview-console",
              level,
              messages: args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a))
            }, "*");
          } catch (e) {}
        };
        ["log", "warn", "error", "info"].forEach(fn => {
          const orig = console[fn];
          console[fn] = function(...args) {
            send(fn, args);
            orig.apply(console, args);
          };
        });
        window.addEventListener("error", (e) => {
          send("error", [e.message + " (line " + e.lineno + ")"]);
        });
      })();
    `;
    doc.head.prepend(consoleBridge);

    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  }
};
