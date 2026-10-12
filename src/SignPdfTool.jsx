import React, { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

const panel = { background: "linear-gradient(145deg, rgba(18,42,33,.96), rgba(7,17,13,.98))", border: "1px solid rgba(123,239,194,.18)", borderRadius: 22, boxShadow: "0 24px 70px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.05)" };
const muted = { color: "rgba(220,235,229,.68)", fontSize: 13, lineHeight: 1.7 };
const button = { border: "1px solid rgba(117,241,193,.3)", borderRadius: 12, padding: "12px 16px", color: "#effff8", background: "linear-gradient(135deg, rgba(40,176,119,.34), rgba(12,76,51,.48))", fontWeight: 800, fontSize: 13, cursor: "pointer" };
const secondary = { ...button, background: "rgba(255,255,255,.035)", borderColor: "rgba(220,235,229,.14)" };

function sizeLabel(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function SignPdfTool() {
  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const pdfRef = useRef(null);
  const loadingTaskRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const strokesRef = useRef([]);
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 595.28, height: 841.89 });
  const [signatureWidth, setSignatureWidth] = useState(150);
  const [signaturePreview, setSignaturePreview] = useState("");
  const [placement, setPlacement] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [previewReady, setPreviewReady] = useState(false);

  const clearResult = useCallback(() => {
    setResult((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  const drawSignaturePad = useCallback(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#123e2c";
    ctx.lineWidth = 3.2;
    for (const stroke of strokesRef.current) {
      if (!stroke.length) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i += 1) ctx.lineTo(stroke[i].x, stroke[i].y);
      if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1);
      ctx.stroke();
    }
    setSignaturePreview(canvas.toDataURL("image/png"));
  }, []);

  useEffect(() => { drawSignaturePad(); }, [drawSignaturePad]);

  const clearSignature = () => {
    strokesRef.current = [];
    setDrawing(false);
    setPlacement(null);
    drawSignaturePad();
    clearResult();
  };

  const startDrawing = (event) => {
    if (busy) return;
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
    drawingRef.current = true;
    lastPointRef.current = point;
    strokesRef.current = [...strokesRef.current, [point]];
    setDrawing(true);
    canvas.setPointerCapture?.(event.pointerId);
    drawSignaturePad();
  };

  const continueDrawing = (event) => {
    if (!drawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
    const strokes = strokesRef.current;
    strokes[strokes.length - 1].push(point);
    lastPointRef.current = point;
    drawSignaturePad();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
    setDrawing(false);
  };

  const createSignaturePng = () => {
    const source = signatureCanvasRef.current;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = source.width * 2;
    exportCanvas.height = source.height * 2;
    const ctx = exportCanvas.getContext("2d");
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#123e2c";
    ctx.lineWidth = 3.2;
    for (const stroke of strokesRef.current) {
      if (!stroke.length) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i += 1) ctx.lineTo(stroke[i].x, stroke[i].y);
      if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1);
      ctx.stroke();
    }
    return new Promise((resolve, reject) => exportCanvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Could not export your signature."));
      blob.arrayBuffer().then(resolve, reject);
    }, "image/png"));
  };

  const chooseFile = async (candidate) => {
    if (!candidate) return;
    if (candidate.type !== "application/pdf" && !/\.pdf$/i.test(candidate.name)) {
      setError("Please choose a PDF file.");
      return;
    }
    setError("");
    setProgress("Opening your PDF…");
    setPreviewReady(false);
    setPlacement(null);
    clearResult();
    try {
      try { await loadingTaskRef.current?.destroy(); } catch {}
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await candidate.arrayBuffer()) });
      loadingTaskRef.current = loadingTask;
      const pdf = await loadingTask.promise;
      pdfRef.current = pdf;
      setFile(candidate);
      setPageCount(pdf.numPages);
      setPageNumber(1);
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      setPageSize({ width: viewport.width, height: viewport.height });
      setProgress("");
    } catch (err) {
      console.error("[FreePDF] Sign PDF open failed:", err);
      setFile(null);
      setError("This PDF could not be opened. It may be damaged, encrypted, or too large for this browser.");
      setProgress("");
    }
  };

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!pdfRef.current || !file) return;
      setPreviewReady(false);
      try {
        const page = await pdfRef.current.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.35 });
        const canvas = previewCanvasRef.current;
        if (!canvas || cancelled) return;
        const context = canvas.getContext("2d", { alpha: false });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;
        if (cancelled) return;
        const original = await PDFDocument.load(await file.arrayBuffer());
        const pageSizeNow = original.getPage(pageNumber - 1).getSize();
        setPageSize(pageSizeNow);
        setPreviewReady(true);
      } catch (err) {
        if (!cancelled) setError("The PDF preview could not be rendered. Try another PDF.");
      }
    };
    render();
    return () => { cancelled = true; };
  }, [file, pageNumber]);

  const handlePreviewClick = (event) => {
    if (!previewReady || busy) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPlacement({ x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)), page: pageNumber });
    clearResult();
  };

  const signPdf = async () => {
    if (!file || busy) return;
    if (!strokesRef.current.some((stroke) => stroke.length > 1)) {
      setError("Draw your signature first.");
      return;
    }
    if (!placement || placement.page !== pageNumber) {
      setError("Click on the PDF preview to choose where your signature should appear on the current page.");
      return;
    }
    setBusy(true);
    setError("");
    setProgress("Adding your signature…");
    clearResult();
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const pngBytes = await createSignaturePng();
      const signature = await pdf.embedPng(pngBytes);
      const targetPage = pdf.getPage(placement.page - 1);
      const size = targetPage.getSize();
      const width = Math.min(signatureWidth, size.width * 0.8);
      const height = width * (signature.height / signature.width);
      const x = Math.max(0, Math.min(size.width - width, placement.x * size.width - width / 2));
      const y = Math.max(0, Math.min(size.height - height, size.height - placement.y * size.height - height / 2));
      targetPage.drawImage(signature, { x, y, width, height });
      setProgress("Finalizing signed PDF…");
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const name = file.name.replace(/\.pdf$/i, "") || "document";
      setResult({ url: URL.createObjectURL(blob), name: name + "-signed.pdf", size: blob.size });
      setProgress("");
    } catch (err) {
      console.error("[FreePDF] Sign PDF failed:", err);
      setError("FreePDF couldn't add the signature to this file. Try a standard, unencrypted PDF.");
      setProgress("");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    try { loadingTaskRef.current?.destroy(); } catch {}
  }, [result?.url]);

  return (
    <section style={{ width: "min(1100px, calc(100% - 32px))", margin: "0 auto 90px", color: "#f3fff9" }}>
      <div style={{ ...panel, padding: "clamp(20px, 4vw, 36px)", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={{ color: "#7cf0bd", font: "11px 'DM Mono', monospace", letterSpacing: ".16em" }}>SIGN PDF</span>
          <span style={{ color: "rgba(220,235,229,.48)", fontSize: 11 }}>· LOCAL BROWSER PROCESSING</span>
        </div>
        <h2 style={{ margin: "0 0 10px", fontSize: "clamp(25px, 4vw, 38px)", letterSpacing: "-.045em" }}>Make it official. Sign your PDF.</h2>
        <p style={{ ...muted, margin: "0 0 24px", maxWidth: 720 }}>Draw your signature, choose where it belongs on the page, and download a signed copy. Your document stays in your browser.</p>
        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ ...secondary, width: "100%", minHeight: 130, borderStyle: "dashed", borderColor: file ? "rgba(124,240,189,.55)" : "rgba(124,240,189,.32)", background: "rgba(255,255,255,.018)" }}>
          <span style={{ display: "block", color: "#83f2c1", fontSize: 27, marginBottom: 8 }}>↑</span>
          <span style={{ display: "block", fontSize: 15 }}>{file ? file.name : "Choose a PDF or drop it here"}</span>
          <span style={{ display: "block", ...muted, fontSize: 12, marginTop: 5 }}>{file ? `${pageCount} pages · ${sizeLabel(file.size)}` : "PDF documents · Multi-page files supported"}</span>
        </button>
        <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { chooseFile(e.target.files?.[0]); e.target.value = ""; }} />
        {file && <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}><button type="button" style={{ ...secondary, padding: "8px 12px", fontSize: 12 }} onClick={() => { setFile(null); setPageCount(0); setPlacement(null); setError(""); setProgress(""); pdfRef.current = null; clearResult(); }} disabled={busy}>Remove PDF</button></div>}
      </div>

      {error && <div role="alert" style={{ ...panel, borderColor: "rgba(255,120,120,.35)", padding: 15, marginBottom: 18, color: "#ffc5c5", fontSize: 13 }}>{error}</div>}
      {progress && <p role="status" style={{ ...muted, color: "#8bf2c3", margin: "0 0 16px" }}>{progress}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 18, alignItems: "start" }}>
        <div style={{ ...panel, padding: "clamp(16px, 3vw, 24px)" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>1. Draw your signature</h3>
          <p style={{ ...muted, margin: "0 0 16px" }}>Use your mouse, trackpad, stylus, or finger on a touchscreen.</p>
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(220,235,229,.2)", background: "linear-gradient(135deg,#f4fff9,#dcebe3)" }}>
            <canvas ref={signatureCanvasRef} width={600} height={200} onPointerDown={startDrawing} onPointerMove={continueDrawing} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} onPointerLeave={() => { if (drawingRef.current) stopDrawing(); }} style={{ width: "100%", height: 160, display: "block", touchAction: "none", cursor: "crosshair" }} />
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 12, flexWrap: "wrap" }}>
            <button type="button" style={secondary} onClick={clearSignature} disabled={busy}>Clear signature</button>
            <span style={{ ...muted, fontSize: 11, alignSelf: "center" }}>Transparent signature · dark emerald ink</span>
          </div>
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>2. Set signature size</h3>
            <label style={{ display: "flex", justifyContent: "space-between", gap: 12, ...muted, marginTop: 14, color: "#dcebe4" }}><span>Width</span><strong style={{ color: "#83f2c1" }}>{signatureWidth} pt</strong></label>
            <input type="range" min="70" max="260" step="5" value={signatureWidth} onChange={(e) => { setSignatureWidth(Number(e.target.value)); clearResult(); }} disabled={busy || !file} style={{ width: "100%", accentColor: "#5fe5ad", marginTop: 8 }} />
            <p style={{ ...muted, fontSize: 11, marginTop: 8 }}>Choose a placement on the PDF preview. You can change pages before signing.</p>
          </div>
        </div>

        <div style={{ ...panel, padding: "clamp(16px, 3vw, 24px)", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <div><h3 style={{ margin: 0, fontSize: 19 }}>3. Place your signature</h3><p style={{ ...muted, margin: "5px 0 0" }}>Click the page where you want it to appear.</p></div>
            {pageCount > 0 && <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <button type="button" style={{ ...secondary, padding: "7px 11px" }} onClick={() => { setPageNumber((n) => Math.max(1, n - 1)); setPlacement(null); }} disabled={pageNumber <= 1 || busy}>←</button>
              <span style={{ ...muted, whiteSpace: "nowrap" }}>Page {pageNumber} / {pageCount}</span>
              <button type="button" style={{ ...secondary, padding: "7px 11px" }} onClick={() => { setPageNumber((n) => Math.min(pageCount, n + 1)); setPlacement(null); }} disabled={pageNumber >= pageCount || busy}>→</button>
            </div>}
          </div>
          {file ? <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(220,235,229,.2)", background: "#ffffff", cursor: previewReady ? "crosshair" : "wait", lineHeight: 0 }} onClick={handlePreviewClick}>
            <canvas ref={previewCanvasRef} style={{ display: "block", width: "100%", height: "auto" }} />
            {placement?.page === pageNumber && signaturePreview && <img src={signaturePreview} alt="Signature placement preview" style={{ position: "absolute", left: `${placement.x * 100}%`, top: `${placement.y * 100}%`, transform: "translate(-50%, -50%)", width: `${Math.min(80, (signatureWidth / pageSize.width) * 100)}%`, height: "auto", pointerEvents: "none", filter: "drop-shadow(0 1px 1px rgba(0,0,0,.08))" }} />}
          </div> : <div style={{ border: "1px dashed rgba(124,240,189,.28)", borderRadius: 14, minHeight: 240, display: "grid", placeItems: "center", padding: 20, textAlign: "center", ...muted }}>Upload a PDF to preview its page here.</div>}
          {file && <p style={{ ...muted, fontSize: 11, margin: "10px 0 0" }}>{placement?.page === pageNumber ? "Placement selected. You can click another spot to move it." : "Select a position on the page to place your signature."}</p>}
        </div>
      </div>

      <button type="button" style={{ ...button, width: "100%", minHeight: 50, marginTop: 18, opacity: !file || !placement || busy ? .55 : 1 }} onClick={signPdf} disabled={!file || !placement || busy}>{busy ? "Signing PDF…" : "Add signature & create signed PDF ↗"}</button>

      {result && <div role="status" style={{ ...panel, padding: 22, marginTop: 18, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", borderColor: "rgba(124,240,189,.35)" }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(57,212,145,.14)", color: "#83f2c1", display: "grid", placeItems: "center", fontSize: 22 }}>✓</div>
        <div style={{ flex: "1 1 200px" }}><strong style={{ display: "block", fontSize: 15 }}>Your signed PDF is ready</strong><span style={{ ...muted, fontSize: 12 }}>{result.name} · {sizeLabel(result.size)}</span><span style={{ ...muted, display: "block", fontSize: 11 }}>This adds a visual signature mark; it is not a certificate-backed digital signature.</span></div>
        <a href={result.url} download={result.name} style={{ ...button, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>↓ Download signed PDF</a>
      </div>}
      <p style={{ ...muted, textAlign: "center", fontSize: 11, marginTop: 18 }}>Your PDF and signature are processed locally in this browser. FreePDF does not upload them.</p>
    </section>
  );
}
