/**
 * Fallback In-Browser Bundler (Used only if opened via file:// where Service Workers are restricted)
 */
window.FallbackBundler = {
  resolvePath(baseFile, relativePath) {
    if (!relativePath || /^(https?:)?\/\//i.test(relativePath) || /^(data:|blob:|mailto:|tel:|javascript:|#)/i.test(relativePath)) {
      return null;
    }
    const cleanRel = relativePath.split("?")[0].split("#")[0];
    if (cleanRel.startsWith("/")) return cleanRel.replace(/^\/+/, "");
    const baseParts = baseFile.split("/");
    baseParts.pop();
    for (const part of cleanRel.split("/")) {
      if (part === "." || part === "") continue;
      if (part === "..") baseParts.pop();
      else baseParts.push(part);
    }
    return baseParts.join("/");
  },

  buildHtmlDocument(entryPath, filesMap) {
    const entryFile = filesMap[entryPath];
    if (!entryFile || entryFile.type !== "text") {
      return "<!DOCTYPE html><html><body><h2>Pilih file HTML pada Entry HTML</h2></body></html>";
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(entryFile.content, "text/html");

    doc.querySelectorAll('link[rel="stylesheet"]').forEach((linkEl) => {
      const resolved = this.resolvePath(entryPath, linkEl.getAttribute("href"));
      if (resolved && filesMap[resolved] && filesMap[resolved].type === "text") {
        const styleEl = doc.createElement("style");
        styleEl.textContent = filesMap[resolved].content;
        linkEl.replaceWith(styleEl);
      }
    });

    doc.querySelectorAll("[src]").forEach((el) => {
      if (el.tagName.toLowerCase() === "script") return;
      const resolved = this.resolvePath(entryPath, el.getAttribute("src"));
      if (resolved && filesMap[resolved] && filesMap[resolved].dataUrl) {
        el.setAttribute("src", filesMap[resolved].dataUrl);
      }
    });

    doc.querySelectorAll("script[src]").forEach((scriptEl) => {
      const resolved = this.resolvePath(entryPath, scriptEl.getAttribute("src"));
      if (resolved && filesMap[resolved] && filesMap[resolved].type === "text") {
        const s = doc.createElement("script");
        if (scriptEl.type) s.type = scriptEl.type;
        s.textContent = filesMap[resolved].content;
        scriptEl.replaceWith(s);
      }
    });

    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  }
};
