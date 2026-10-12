import React, { useRef, useState } from "react";
import JSZip from "jszip";

const panel = { background: "linear-gradient(145deg, rgba(18,42,33,.94), rgba(7,17,13,.96))", border: "1px solid rgba(123,239,194,.18)", borderRadius: 22, boxShadow: "0 24px 70px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.05)" };
const muted = { color: "rgba(220,235,229,.66)", fontSize: 13, lineHeight: 1.7 };
const button = { border: "1px solid rgba(117,241,193,.28)", borderRadius: 12, padding: "12px 16px", color: "#effff8", background: "linear-gradient(135deg, rgba(40,176,119,.32), rgba(12,76,51,.45))", fontWeight: 800, fontSize: 13, cursor: "pointer" };
const secondary = { ...button, background: "rgba(255,255,255,.035)", borderColor: "rgba(220,235,229,.13)" };

function bytesToSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function canvasBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image export failed")), mime, quality));
}

export default function PdfToImageTool() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("image/png");
  const [scale, setScale] = useState("2");
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState(null);

  const clearResult = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  };

  const chooseFile = (candidate) => {
    if (!candidate) return;
    if (candidate.type !== "application/pdf" && !/\.pdf$/i.test(candidate.name)) {
      setError("Please choose a PDF file.");
      return;
    }
    setFile(candidate);
    setError("");
    setProgress("");
    clearResult();
  };

  const convert = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    clearResult();
    setProgress("Loading PDF renderer…");
    let loadingTask;
    try {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
      const data = new Uint8Array(await file.arrayBuffer());
      loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;
      const zip = new JSZip();
      const baseName = file.name.replace(/\.pdf$/i, "") || "document";
      const extension = format === "image/png" ? "png" : "jpg";
      const mime = format;
      const renderScale = Number(scale);
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        setProgress(`Rendering page ${pageNumber} of ${pdf.numPages}…`);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: format === "image/png" });
        if (!context) throw new Error("Canvas is unavailable in this browser.");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: context, viewport, background: format === "image/jpeg" ? "#ffffff" : undefined }).promise;
        if (format === "image/jpeg") {
          context.save();
          context.globalCompositeOperation = "destination-over";
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.restore();
        }
        const blob = await canvasBlob(canvas, mime, quality / 100);
        zip.file(`${baseName}-page-${String(pageNumber).padStart(3, "0")}.${extension}`, blob);
        canvas.width = 0;
        canvas.height = 0;
      }
      setProgress("Packing images into a ZIP file…");
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 4 } });
      setResult({ url: URL.createObjectURL(blob), name: `${baseName}-images.zip`, size: blob.size, pages: pdf.numPages });
      setProgress("");
      await pdf.destroy();
    } catch (err) {
      console.error("[FreePDF] PDF to image failed:", err);
      setError("This PDF could not be converted. It may be damaged, encrypted, or too large for the available browser memory.");
      setProgress("");
      try { await loadingTask?.destroy(); } catch {}
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={{ width: "min(1000px, calc(100% - 32px))", margin: "0 auto 90px", color: "#f3fff9" }}>
      <div style={{ ...panel, padding: "clamp(20px, 4vw, 36px)", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={{ color: "#7cf0bd", font: "11px 'DM Mono', monospace", letterSpacing: ".16em" }}>PDF → IMAGE</span>
          <span style={{ color: "rgba(220,235,229,.45)", fontSize: 11 }}>· LOCAL BROWSER PROCESSING</span>
        </div>
        <h2 style={{ margin: "0 0 10px", fontSize: "clamp(25px, 4vw, 38px)", letterSpacing: "-.045em" }}>Turn every PDF page into an image.</h2>
        <p style={{ ...muted, margin: "0 0 24px", maxWidth: 680 }}>Export all pages as crisp JPG or PNG files. FreePDF packages them into one ZIP so you can download everything at once.</p>

        <button type="button" style={{ ...secondary, width: "100%", minHeight: 154, borderStyle: "dashed", borderColor: file ? "rgba(124,240,189,.5)" : "rgba(124,240,189,.35)", background: "rgba(255,255,255,.018)" }} onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); chooseFile(e.dataTransfer.files?.[0]); }}>
          <span style={{ display: "block", color: "#83f2c1", fontSize: 27, marginBottom: 8 }}>↑</span>
          <span style={{ display: "block", fontSize: 15 }}>{file ? file.name : "Choose a PDF or drop it here"}</span>
          <span style={{ display: "block", ...muted, fontSize: 12, marginTop: 5 }}>{file ? `${bytesToSize(file.size)} · Ready to convert` : "One PDF · Multi-page files supported"}</span>
        </button>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { chooseFile(e.target.files?.[0]); e.target.value = ""; }} />
        {file && <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}><button type="button" style={{ ...secondary, padding: "8px 12px", fontSize: 12 }} onClick={() => { setFile(null); setError(""); setProgress(""); clearResult(); }} disabled={busy}>Remove PDF</button></div>}
      </div>

      {error && <div role="alert" style={{ ...panel, borderColor: "rgba(255,120,120,.35)", padding: 15, marginBottom: 18, color: "#ffc5c5", fontSize: 13 }}>{error}</div>}

      <div style={{ ...panel, padding: "clamp(18px, 3vw, 28px)", marginBottom: 18 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>Export settings</h3>
        <p style={{ ...muted, margin: "0 0 20px" }}>Higher resolution gives sharper images but uses more memory and creates larger files.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
          <label style={{ display: "grid", gap: 8, fontSize: 12, color: "#dcebe4", fontWeight: 700 }}>Image format
            <select value={format} onChange={(e) => { setFormat(e.target.value); clearResult(); }} disabled={busy} style={{ width: "100%", padding: "12px 13px", borderRadius: 11, border: "1px solid rgba(220,235,229,.16)", color: "#f3fff9", background: "#10251c" }}>
              <option value="image/png">PNG · lossless, larger files</option>
              <option value="image/jpeg">JPG · smaller files</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 8, fontSize: 12, color: "#dcebe4", fontWeight: 700 }}>Resolution
            <select value={scale} onChange={(e) => { setScale(e.target.value); clearResult(); }} disabled={busy} style={{ width: "100%", padding: "12px 13px", borderRadius: 11, border: "1px solid rgba(220,235,229,.16)", color: "#f3fff9", background: "#10251c" }}>
              <option value="1.5">Standard · 1.5×</option>
              <option value="2">High · 2×</option>
              <option value="3">Ultra · 3×</option>
            </select>
          </label>
        </div>
        {format === "image/jpeg" && <label style={{ display: "grid", gap: 10, marginTop: 18, fontSize: 12, color: "#dcebe4", fontWeight: 700 }}>JPG quality <span style={{ color: "#83f2c1", fontFamily: "'DM Mono', monospace" }}>{quality}%</span>
          <input type="range" min="50" max="100" step="5" value={quality} onChange={(e) => { setQuality(Number(e.target.value)); clearResult(); }} disabled={busy} style={{ width: "100%", accentColor: "#5fe5ad" }} />
          <span style={{ ...muted, fontSize: 11 }}>Higher quality preserves detail and increases file size.</span>
        </label>}
        <button type="button" style={{ ...button, width: "100%", marginTop: 22, minHeight: 48, opacity: !file || busy ? .55 : 1 }} onClick={convert} disabled={!file || busy}>{busy ? "Converting…" : "Convert PDF to images ↗"}</button>
        {progress && <p role="status" style={{ ...muted, color: "#8bf2c3", margin: "14px 0 0" }}>{progress}</p>}
      </div>

      {result && <div role="status" style={{ ...panel, padding: 22, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", borderColor: "rgba(124,240,189,.35)" }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(57,212,145,.14)", color: "#83f2c1", display: "grid", placeItems: "center", fontSize: 22 }}>✓</div>
        <div style={{ flex: "1 1 200px" }}><strong style={{ display: "block", fontSize: 15 }}>Your images are ready</strong><span style={{ ...muted, fontSize: 12 }}>{result.pages} pages · {result.name} · {bytesToSize(result.size)}</span></div>
        <a href={result.url} download={result.name} style={{ ...button, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>↓ Download ZIP</a>
      </div>}
      <p style={{ ...muted, textAlign: "center", fontSize: 11, marginTop: 18 }}>PDF pages are rendered on your device. The PDF is not uploaded by this converter.</p>
    </section>
  );
}
