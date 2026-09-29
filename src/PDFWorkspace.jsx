import React, { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${
    units[index]
  }`;
};

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

async function readPDF(file) {
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
  });

  const pdf = await loadingTask.promise;

  return {
    id: makeId(),
    file,
    buffer,
    name: file.name,
    size: file.size,
    pages: pdf.numPages,
    pdf,
  };
}

function PDFThumbnail({ pdf, pageNumber }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        const page = await pdf.getPage(pageNumber);

        if (cancelled || !canvasRef.current) return;

        const baseViewport = page.getViewport({
          scale: 1,
        });

        const targetWidth = 150;
        const scale = targetWidth / baseViewport.width;

        const viewport = page.getViewport({
          scale,
        });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);

        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        await page.render({
          canvasContext: context,
          viewport,
          transform:
            outputScale !== 1
              ? [outputScale, 0, 0, outputScale, 0, 0]
              : null,
        }).promise;
      } catch (error) {
        console.error("PDF thumbnail render failed:", error);
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  return (
    <canvas
      ref={canvasRef}
      className="freepdf-page-canvas"
      aria-label={`PDF page ${pageNumber}`}
    />
  );
}

export default function PDFWorkspace() {
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addFiles = useCallback(async (incomingFiles) => {
    const selected = Array.from(incomingFiles || []);

    const pdfFiles = selected.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (!pdfFiles.length) {
      setError("Please choose one or more PDF files.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const loaded = [];

      for (const file of pdfFiles) {
        try {
          const pdf = await readPDF(file);
          loaded.push(pdf);
        } catch {
          setError(
            `FreePDF couldn't read "${file.name}". The file may be damaged or password-protected.`
          );
        }
      }

      if (loaded.length) {
        setFiles((current) => [...current, ...loaded]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = async (event) => {
    await addFiles(event.target.files);

    // Allows selecting the same file again later.
    event.target.value = "";
  };

  const handleDrop = async (event) => {
    event.preventDefault();

    setDragging(false);

    await addFiles(event.dataTransfer.files);
  };

  const removeFile = (id) => {
    setFiles((current) => current.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setError("");
  };

  const totalPages = files.reduce(
    (total, item) => total + item.pages,
    0
  );

  const totalSize = files.reduce(
    (total, item) => total + item.size,
    0
  );

  return (
    <section className="freepdf-workspace" id="freepdf-workspace">
      <div className="freepdf-workspace-orb freepdf-workspace-orb-one" />
      <div className="freepdf-workspace-orb freepdf-workspace-orb-two" />

      <div className="freepdf-workspace-inner">
        <div className="freepdf-workspace-heading">
          <div>
            <div className="freepdf-eyebrow">
              <span className="freepdf-eyebrow-dot" />
              PRIVATE PDF WORKSPACE
            </div>

            <h2>
              Drop your PDFs.
              <br />
              <span>Let's get to work.</span>
            </h2>

            <p>
              Your files are opened directly in your browser. No account,
              no watermark and no unnecessary upload step.
            </p>
          </div>

          {files.length > 0 && (
            <button
              type="button"
              className="freepdf-clear-button"
              onClick={clearAll}
            >
              Clear workspace
            </button>
          )}
        </div>

        <div
          className={`freepdf-dropzone ${
            dragging ? "is-dragging" : ""
          } ${files.length ? "has-files" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) {
              setDragging(false);
            }
          }}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={handleInput}
          />

          <div className="freepdf-upload-icon">
            <div className="freepdf-upload-icon-inner">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 20h14" />
              </svg>
            </div>
          </div>

          <div className="freepdf-upload-copy">
            <h3>
              {dragging
                ? "Release to add your PDFs"
                : "Drag & drop your PDFs here"}
            </h3>

            <p>
              or choose files from your device
            </p>
          </div>

          <button
            type="button"
            className="freepdf-browse-button"
            onClick={() => inputRef.current?.click()}
          >
            Choose PDF files
            <span>→</span>
          </button>

          <div className="freepdf-upload-meta">
            <span>PDF only</span>
            <i />
            <span>Multiple files supported</span>
            <i />
            <span>Browser-side</span>
          </div>

          {loading && (
            <div className="freepdf-loading">
              <span className="freepdf-spinner" />
              Reading your PDF...
            </div>
          )}
        </div>

        {error && (
          <div className="freepdf-error">
            <span>!</span>
            {error}
          </div>
        )}

        {files.length > 0 && (
          <>
            <div className="freepdf-stats">
              <div className="freepdf-stat">
                <strong>{files.length}</strong>
                <span>PDF{files.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="freepdf-stat-divider" />

              <div className="freepdf-stat">
                <strong>{totalPages}</strong>
                <span>Pages</span>
              </div>

              <div className="freepdf-stat-divider" />

              <div className="freepdf-stat">
                <strong>{formatBytes(totalSize)}</strong>
                <span>Total size</span>
              </div>
            </div>

            <div className="freepdf-file-list">
              {files.map((item, index) => (
                <article className="freepdf-file-card" key={item.id}>
                  <div className="freepdf-file-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="freepdf-file-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M8 13h8" />
                      <path d="M8 17h5" />
                    </svg>
                  </div>

                  <div className="freepdf-file-info">
                    <strong title={item.name}>
                      {item.name}
                    </strong>

                    <span>
                      {item.pages}{" "}
                      {item.pages === 1 ? "page" : "pages"} ·{" "}
                      {formatBytes(item.size)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="freepdf-remove-file"
                    onClick={() => removeFile(item.id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>

            <div className="freepdf-preview-shell">
              <div className="freepdf-preview-header">
                <div>
                  <span className="freepdf-preview-label">
                    LIVE PREVIEW
                  </span>

                  <h3>Pages in your workspace</h3>
                </div>

                <span className="freepdf-preview-count">
                  {totalPages}{" "}
                  {totalPages === 1 ? "page" : "pages"}
                </span>
              </div>

              <div className="freepdf-pages-grid">
                {files.flatMap((file) =>
                  Array.from(
                    { length: file.pages },
                    (_, index) => (
                      <div
                        className="freepdf-page-card"
                        key={`${file.id}-${index + 1}`}
                      >
                        <div className="freepdf-page-preview">
                          <PDFThumbnail
                            pdf={file.pdf}
                            pageNumber={index + 1}
                          />

                          <div className="freepdf-page-glow" />
                        </div>

                        <div className="freepdf-page-footer">
                          <span>
                            Page {index + 1}
                          </span>

                          <span className="freepdf-page-source">
                            {file.name}
                          </span>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            <div className="freepdf-action-panel">
              <div>
                <span className="freepdf-preview-label">
                  NEXT STEP
                </span>

                <h3>What do you want to do?</h3>

                <p>
                  Your PDFs are loaded and ready. The editing
                  actions will appear here as we build the
                  FreePDF engine.
                </p>
              </div>

              <div className="freepdf-action-grid">
                <button type="button" className="freepdf-action-card">
                  <span>Merge</span>
                  <small>Combine PDFs</small>
                  <b>→</b>
                </button>

                <button type="button" className="freepdf-action-card">
                  <span>Split</span>
                  <small>Separate pages</small>
                  <b>→</b>
                </button>

                <button type="button" className="freepdf-action-card">
                  <span>Extract</span>
                  <small>Keep selected pages</small>
                  <b>→</b>
                </button>

                <button type="button" className="freepdf-action-card">
                  <span>Compress</span>
                  <small>Reduce file size</small>
                  <b>→</b>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
