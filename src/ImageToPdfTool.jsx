import React, { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

const panel = { background: "linear-gradient(145deg, rgba(18,42,33,.94), rgba(7,17,13,.96))", border: "1px solid rgba(123,239,194,.18)", borderRadius: 22, boxShadow: "0 24px 70px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.05)" };
const muted = { color: "rgba(220,235,229,.66)", fontSize: 13, lineHeight: 1.7 };
const button = { border: "1px solid rgba(117,241,193,.28)", borderRadius: 12, padding: "12px 16px", color: "#effff8", background: "linear-gradient(135deg, rgba(40,176,119,.32), rgba(12,76,51,.45))", fontWeight: 800, fontSize: 13, cursor: "pointer" };
const secondary = { ...button, background: "rgba(255,255,255,.035)", borderColor: "rgba(220,235,229,.13)" };
const formats = ["image/jpeg", "image/png"];

function bytesToSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function ImageToPdfTool() {
  const inputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [pageSize, setPageSize] = useState("fit");
  const [progress, setProgress] = useState("");

  const releaseResult = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  };

  const addFiles = (list) => {
    setError("");
    releaseResult();
    const incoming = Array.from(list || []);
    const valid = incoming.filter((file) => formats.includes(file.type) || /\.(jpe?g|png)$/i.test(file.name));
    if (!valid.length && incoming.length) {
      setError("Please choose JPG, JPEG or PNG images.");
      return;
    }
    setImages((current) => {
      const combined = [...current, ...valid].slice(0, 100);
      return combined.map((file, index) => ({
        file,
        id: `${file.name}-${file.size}-${file.lastModified}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        preview: URL.createObjectURL(file),
      }));
    });
  };

  const removeImage = (id) => {
    setImages((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((item) => item.id !== id);
    });
    releaseResult();
  };

  const moveImage = (index, delta) => {
    setImages((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    releaseResult();
  };

  const createPdf = async () => {
    if (!images.length || busy) return;
    setBusy(true);
    setError("");
    setProgress("Preparing your images…");
    releaseResult();
    try {
      const pdf = await PDFDocument.create();
      const margin = pageSize === "fit" ? 0 : 28;
      const A4 = { width: 595.28, height: 841.89 };
      for (let index = 0; index < images.length; index += 1) {
        const item = images[index];
        setProgress(`Embedding image ${index + 1} of ${images.length}…`);
        const bytes = await item.file.arrayBuffer();
        const isPng = item.file.type === "image/png" || /\.png$/i.test(item.file.name);
        const embedded = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        let pageWidth = embedded.width * 0.75;
        let pageHeight = embedded.height * 0.75;
        let drawX = 0;
        let drawY = 0;
        let drawWidth = pageWidth;
        let drawHeight = pageHeight;
        if (pageSize === "a4") {
          const landscape = embedded.width > embedded.height;
          pageWidth = landscape ? A4.height : A4.width;
          pageHeight = landscape ? A4.width : A4.height;
          const availableWidth = pageWidth - margin * 2;
          const availableHeight = pageHeight - margin * 2;
          const scale = Math.min(availableWidth / embedded.width, availableHeight / embedded.height);
          drawWidth = embedded.width * scale;
          drawHeight = embedded.height * scale;
          drawX = (pageWidth - drawWidth) / 2;
          drawY = (pageHeight - drawHeight) / 2;
        }
        const page = pdf.addPage([pageWidth, pageHeight]);
        page.drawImage(embedded, { x: drawX, y: drawY, width: drawWidth, height: drawHeight });
      }
      setProgress("Finalizing the PDF…");
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResult({ url: URL.createObjectURL(blob), name: "images-converted.pdf", size: blob.size });
      setProgress("");
    } catch (err) {
      console.error("[FreePDF] Image to PDF failed:", err);
      setError("One of these images could not be processed. Try saving it as a standard JPG or PNG and adding it again.");
      setProgress("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={{ width: "min(1000px, calc(100% - 32px))", margin: "0 auto 90px", color: "#f3fff9" }}>
      <div style={{ ...panel, padding: "clamp(20px, 4vw, 36px)", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={{ color: "#7cf0bd", font: "11px 'DM Mono', monospace", letterSpacing: ".16em" }}>IMAGE → PDF</span>
          <span style={{ color: "rgba(220,235,229,.45)", fontSize: 11 }}>· LOCAL BROWSER PROCESSING</span>
        </div>
        <h2 style={{ margin: "0 0 10px", fontSize: "clamp(25px, 4vw, 38px)", letterSpacing: "-.045em" }}>Turn your images into one PDF.</h2>
        <p style={{ ...muted, margin: "0 0 24px", maxWidth: 680 }}>Add JPG or PNG images, arrange them in the order you want, and create a clean PDF. Your images are processed in this browser.</p>

        <button type="button" style={{ ...secondary, width: "100%", minHeight: 154, borderStyle: "dashed", borderColor: dragging ? "rgba(124,240,189,.8)" : "rgba(124,240,189,.35)", background: dragging ? "rgba(35,180,118,.12)" : "rgba(255,255,255,.018)" }} onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}>
          <span style={{ display: "block", color: "#83f2c1", fontSize: 27, marginBottom: 8 }}>＋</span>
          <span style={{ display: "block", fontSize: 15 }}>Choose images or drop them here</span>
          <span style={{ display: "block", ...muted, fontSize: 12, marginTop: 5 }}>JPG · JPEG · PNG · up to 100 images</span>
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {error && <div role="alert" style={{ ...panel, borderColor: "rgba(255,120,120,.35)", padding: 15, marginBottom: 18, color: "#ffc5c5", fontSize: 13 }}>{error}</div>}

      {images.length > 0 && <div style={{ ...panel, padding: "clamp(18px, 3vw, 28px)", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <div><h3 style={{ margin: 0, fontSize: 19 }}>Your image order <span style={{ color: "#7cf0bd" }}>({images.length})</span></h3><p style={{ ...muted, margin: "5px 0 0" }}>Each image becomes one PDF page. Use arrows to reorder.</p></div>
          <button type="button" style={secondary} onClick={() => { images.forEach((item) => URL.revokeObjectURL(item.preview)); setImages([]); releaseResult(); setError(""); }} disabled={busy}>Clear all</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: 12 }}>
          {images.map((item, index) => <div key={item.id} style={{ border: "1px solid rgba(220,235,229,.12)", background: "rgba(255,255,255,.025)", borderRadius: 15, padding: 10, minWidth: 0 }}>
            <div style={{ height: 140, borderRadius: 10, background: "rgba(0,0,0,.24)", display: "grid", placeItems: "center", overflow: "hidden", marginBottom: 10 }}>
              <img src={item.preview} alt={item.file.name} style={{ display: "block", maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.file.name}>{index + 1}. {item.file.name}</div>
            <div style={{ ...muted, fontSize: 11, marginTop: 3 }}>{bytesToSize(item.file.size)}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button type="button" aria-label="Move image up" title="Move up" onClick={() => moveImage(index, -1)} disabled={index === 0 || busy} style={{ ...secondary, padding: "6px 10px", flex: 1, opacity: index === 0 ? .4 : 1 }}>↑</button>
              <button type="button" aria-label="Move image down" title="Move down" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1 || busy} style={{ ...secondary, padding: "6px 10px", flex: 1, opacity: index === images.length - 1 ? .4 : 1 }}>↓</button>
              <button type="button" aria-label={`Remove ${item.file.name}`} onClick={() => removeImage(item.id)} disabled={busy} style={{ ...secondary, padding: "6px 10px", color: "#ffc2c2" }}>×</button>
            </div>
          </div>)}
        </div>
        <div style={{ borderTop: "1px solid rgba(220,235,229,.1)", marginTop: 22, paddingTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 8, fontSize: 12, color: "#dcebe4", fontWeight: 700 }}>Page layout
            <select value={pageSize} onChange={(e) => { setPageSize(e.target.value); releaseResult(); }} disabled={busy} style={{ width: "100%", padding: "12px 13px", borderRadius: 11, border: "1px solid rgba(220,235,229,.16)", color: "#f3fff9", background: "#10251c" }}>
              <option value="fit">Fit image exactly (original proportions)</option>
              <option value="a4">A4 pages (fit and center)</option>
            </select>
          </label>
          <button type="button" style={{ ...button, minHeight: 45 }} onClick={createPdf} disabled={busy || !images.length}>{busy ? "Creating PDF…" : `Create PDF · ${images.length} ${images.length === 1 ? "page" : "pages"}`}</button>
        </div>
        {progress && <p role="status" style={{ ...muted, color: "#8bf2c3", margin: "14px 0 0" }}>{progress}</p>}
      </div>}

      {result && <div role="status" style={{ ...panel, padding: 22, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", borderColor: "rgba(124,240,189,.35)" }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(57,212,145,.14)", color: "#83f2c1", display: "grid", placeItems: "center", fontSize: 22 }}>✓</div>
        <div style={{ flex: "1 1 200px" }}><strong style={{ display: "block", fontSize: 15 }}>Your PDF is ready</strong><span style={{ ...muted, fontSize: 12 }}>{result.name} · {bytesToSize(result.size)}</span></div>
        <a href={result.url} download={result.name} style={{ ...button, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>↓ Download PDF</a>
      </div>}
      <p style={{ ...muted, textAlign: "center", fontSize: 11, marginTop: 18 }}>Files are processed on your device. Nothing is uploaded by this converter.</p>
    </section>
  );
}
