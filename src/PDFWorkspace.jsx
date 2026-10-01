import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { PDFDocument } from "pdf-lib";

/*
 * PDF.js is intentionally NOT imported at the top of this file.
 *
 * FreePDF must be able to start without PDF.js.
 *
 * pdf-lib = authoritative PDF engine
 * PDF.js  = optional visual thumbnail renderer
 */

let pdfjsPromise = null;

async function loadPDFJS() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(
      "pdfjs-dist/legacy/build/pdf.mjs"
    )
      .then((pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          new URL(
            "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
            import.meta.url
          ).toString();

        return pdfjsLib;
      })
      .catch((error) => {
        console.warn(
          "[FreePDF] PDF.js could not be loaded:",
          error
        );

        /*
         * Allow a future PDF to try loading PDF.js
         * again if the first attempt failed.
         */
        pdfjsPromise = null;

        return null;
      });
  }

  return pdfjsPromise;
}

const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(
    bytes / Math.pow(1024, index)
  ).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const makeId = () =>
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

/*
 * IMPORTANT ARCHITECTURE
 *
 * pdf-lib is the authoritative PDF reader.
 * PDF.js is ONLY used for visual thumbnails.
 *
 * PDF.js is loaded dynamically so a Safari/iOS
 * compatibility problem cannot prevent FreePDF
 * from loading.
 */
async function readPDF(file) {
  /*
   * Read the original file.
   */
  const buffer = await file.arrayBuffer();

  /*
   * pdf-lib validates and reads the PDF.
   *
   * This is independent from PDF.js.
   */
  const pdfDocument =
    await PDFDocument.load(buffer);

  const pages =
    pdfDocument.getPageCount();

  /*
   * Keep a fresh independent Uint8Array
   * for future PDF operations.
   */
  const operationBytes =
    new Uint8Array(buffer.slice(0));

  /*
   * PDF.js is OPTIONAL.
   *
   * If PDF.js fails on Safari/iOS/iPadOS,
   * the PDF remains completely usable.
   */
  let previewPdf = null;

  try {
    const pdfjsLib =
      await loadPDFJS();

    if (pdfjsLib) {
      const previewBytes =
        new Uint8Array(buffer.slice(0));

      const loadingTask =
        pdfjsLib.getDocument({
          data: previewBytes,
        });

      previewPdf =
        await loadingTask.promise;
    }
  } catch (previewError) {
    console.warn(
      "[FreePDF] PDF.js preview unavailable:",
      previewError
    );

    previewPdf = null;
  }

  return {
    id: makeId(),
    file,
    buffer: operationBytes,
    name: file.name,
    size: file.size,
    pages,
    pdf: previewPdf,
    previewAvailable:
      Boolean(previewPdf),
  };
}

function PDFThumbnail({
  pdf,
  pageNumber,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!pdf) return;

      try {
        const page =
          await pdf.getPage(pageNumber);

        if (
          cancelled ||
          !canvasRef.current
        ) {
          return;
        }

        const baseViewport =
          page.getViewport({
            scale: 1,
          });

        const targetWidth = 150;

        const scale =
          targetWidth /
          baseViewport.width;

        const viewport =
          page.getViewport({
            scale,
          });

        const canvas =
          canvasRef.current;

        const context =
          canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Canvas 2D context unavailable."
          );
        }

        const outputScale =
          window.devicePixelRatio || 1;

        canvas.width =
          Math.floor(
            viewport.width *
              outputScale
          );

        canvas.height =
          Math.floor(
            viewport.height *
              outputScale
          );

        canvas.style.width =
          `${Math.floor(
            viewport.width
          )}px`;

        canvas.style.height =
          `${Math.floor(
            viewport.height
          )}px`;

        await page.render({
          canvasContext: context,
          viewport,
          transform:
            outputScale !== 1
              ? [
                  outputScale,
                  0,
                  0,
                  outputScale,
                  0,
                  0,
                ]
              : null,
        }).promise;
      } catch (error) {
        console.warn(
          "[FreePDF] Thumbnail render failed:",
          error
        );
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  if (!pdf) {
    return (
      <div className="freepdf-preview-fallback">
        <div className="freepdf-preview-fallback-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M8 13h8" />
            <path d="M8 17h5" />
          </svg>
        </div>

        <span>PDF</span>
      </div>
    );
  }

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

  const [files, setFiles] =
    useState([]);

  const [dragging, setDragging] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(null);

  const addFiles = useCallback(
    async (incomingFiles) => {
      const selected =
        Array.from(
          incomingFiles || []
        );

      const pdfFiles =
        selected.filter(
          (file) =>
            file.type ===
              "application/pdf" ||
            file.name
              .toLowerCase()
              .endsWith(".pdf")
        );

      if (!pdfFiles.length) {
        setError(
          "Please choose one or more PDF files."
        );

        return;
      }

      setError("");
      setSuccess(null);
      setLoading(true);

      try {
        const loaded = [];

        for (const file of pdfFiles) {
          try {
            const pdf =
              await readPDF(file);

            loaded.push(pdf);
          } catch (readError) {
            console.error(
              "[FreePDF] PDF validation failed:",
              file.name,
              readError
            );

            setError(
              `FreePDF couldn't read "${file.name}". The PDF may be damaged, encrypted, or unsupported by pdf-lib.`
            );
          }
        }

        if (loaded.length) {
          setFiles(
            (current) => [
              ...current,
              ...loaded,
            ]
          );
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleInput = async (
    event
  ) => {
    await addFiles(
      event.target.files
    );

    event.target.value = "";
  };

  const handleDrop = async (
    event
  ) => {
    event.preventDefault();

    setDragging(false);

    await addFiles(
      event.dataTransfer.files
    );
  };

  const removeFile = (id) => {
    setFiles(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );

    setSuccess(null);
  };

  const clearAll = () => {
    setFiles([]);
    setError("");
    setSuccess(null);
  };

  const totalPages =
    files.reduce(
      (total, item) =>
        total + item.pages,
      0
    );

  const totalSize =
    files.reduce(
      (total, item) =>
        total + item.size,
      0
    );

  /*
   * MERGE
   *
   * This is the known-good implementation.
   * Do not change this unless we intentionally
   * modify Merge in the future.
   */
  const mergePDFs = async () => {
    if (files.length < 2) {
      setError(
        "Add at least two PDF files to merge them."
      );

      return;
    }

    setError("");
    setSuccess(null);
    setProcessing(true);

    try {
      const mergedPdf =
        await PDFDocument.create();

      for (const item of files) {
        /*
         * Create a fresh copy for every load.
         *
         * This prevents one operation from
         * affecting another.
         */
        const sourceBytes =
          new Uint8Array(
            item.buffer.slice(0)
          );

        const sourcePdf =
          await PDFDocument.load(
            sourceBytes
          );

        const copiedPages =
          await mergedPdf.copyPages(
            sourcePdf,
            sourcePdf.getPageIndices()
          );

        copiedPages.forEach(
          (page) => {
            mergedPdf.addPage(page);
          }
        );
      }

      const mergedBytes =
        await mergedPdf.save();

      const blob =
        new Blob(
          [mergedBytes],
          {
            type:
              "application/pdf",
          }
        );

      const url =
        URL.createObjectURL(blob);

      setSuccess({
        url,
        filename:
          "FreeToolz-Merged.pdf",
        size:
          mergedBytes.byteLength,
        pages:
          totalPages,
      });
    } catch (mergeError) {
      console.error(
        "[FreePDF] PDF merge failed:",
        mergeError
      );

      setError(
        "FreePDF couldn't merge these files. One of the PDFs may be encrypted, damaged, or unsupported by pdf-lib."
      );
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!success?.url) return;

    const link =
      document.createElement("a");

    link.href =
      success.url;

    link.download =
      success.filename;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();
  };

  const startAgain = () => {
    if (success?.url) {
      URL.revokeObjectURL(
        success.url
      );
    }

    setSuccess(null);
    setError("");
  };

  return (
    <section
      className="freepdf-workspace"
      id="freepdf-workspace"
    >
      <div className="freepdf-workspace-orb freepdf-workspace-orb-one" />

      <div className="freepdf-workspace-orb freepdf-workspace-orb-two" />

      <div className="freepdf-workspace-inner">
        {!success ? (
          <>
            <div className="freepdf-workspace-heading">
              <div>
                <div className="freepdf-eyebrow">
                  <span className="freepdf-eyebrow-dot" />
                  PRIVATE PDF WORKSPACE
                </div>

                <h2>
                  Drop your PDFs.
                  <br />
                  <span>
                    Let's get to work.
                  </span>
                </h2>

                <p>
                  Your files are opened directly
                  in your browser. No account,
                  no watermark and no unnecessary
                  upload step.
                </p>
              </div>

              {files.length > 0 && (
                <button
                  type="button"
                  className="freepdf-clear-button"
                  onClick={
                    clearAll
                  }
                >
                  Clear workspace
                </button>
              )}
            </div>

            <div
              className={`freepdf-dropzone ${
                dragging
                  ? "is-dragging"
                  : ""
              } ${
                files.length
                  ? "has-files"
                  : ""
              }`}
              onDragEnter={(
                event
              ) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                if (
                  event.currentTarget ===
                  event.target
                ) {
                  setDragging(false);
                }
              }}
              onDrop={
                handleDrop
              }
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                hidden
                onChange={
                  handleInput
                }
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
                onClick={() =>
                  inputRef.current?.click()
                }
              >
                Choose PDF files
                <span>
                  →
                </span>
              </button>

              <div className="freepdf-upload-meta">
                <span>
                  PDF only
                </span>

                <i />

                <span>
                  Multiple files supported
                </span>

                <i />

                <span>
                  Browser-side
                </span>
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
                <span>
                  !
                </span>

                {error}
              </div>
            )}

            {files.length > 0 && (
              <>
                <div className="freepdf-stats">
                  <div className="freepdf-stat">
                    <strong>
                      {files.length}
                    </strong>

                    <span>
                      PDF
                      {files.length !==
                      1
                        ? "s"
                        : ""}
                    </span>
                  </div>

                  <div className="freepdf-stat-divider" />

                  <div className="freepdf-stat">
                    <strong>
                      {totalPages}
                    </strong>

                    <span>
                      Pages
                    </span>
                  </div>

                  <div className="freepdf-stat-divider" />

                  <div className="freepdf-stat">
                    <strong>
                      {formatBytes(
                        totalSize
                      )}
                    </strong>

                    <span>
                      Total size
                    </span>
                  </div>
                </div>

                <div className="freepdf-file-list">
                  {files.map(
                    (
                      item,
                      index
                    ) => (
                      <article
                        className="freepdf-file-card"
                        key={
                          item.id
                        }
                      >
                        <div className="freepdf-file-number">
                          {String(
                            index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
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
                          <strong
                            title={
                              item.name
                            }
                          >
                            {
                              item.name
                            }
                          </strong>

                          <span>
                            {
                              item.pages
                            }{" "}
                            {item.pages ===
                            1
                              ? "page"
                              : "pages"}{" "}
                            ·{" "}
                            {formatBytes(
                              item.size
                            )}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="freepdf-remove-file"
                          onClick={() =>
                            removeFile(
                              item.id
                            )
                          }
                          aria-label={`Remove ${item.name}`}
                        >
                          ×
                        </button>
                      </article>
                    )
                  )}
                </div>

                <div className="freepdf-preview-shell">
                  <div className="freepdf-preview-header">
                    <div>
                      <span className="freepdf-preview-label">
                        LIVE PREVIEW
                      </span>

                      <h3>
                        Pages in your workspace
                      </h3>
                    </div>

                    <span className="freepdf-preview-count">
                      {
                        totalPages
                      }{" "}
                      {totalPages ===
                      1
                        ? "page"
                        : "pages"}
                    </span>
                  </div>

                  <div className="freepdf-pages-grid">
                    {files.flatMap(
                      (
                        file
                      ) =>
                        Array.from(
                          {
                            length:
                              file.pages,
                          },
                          (
                            _,
                            index
                          ) => (
                            <div
                              className="freepdf-page-card"
                              key={`${file.id}-${index + 1}`}
                            >
                              <div className="freepdf-page-preview">
                                <PDFThumbnail
                                  pdf={
                                    file.pdf
                                  }
                                  pageNumber={
                                    index +
                                    1
                                  }
                                />

                                <div className="freepdf-page-glow" />
                              </div>

                              <div className="freepdf-page-footer">
                                <span>
                                  Page{" "}
                                  {
                                    index +
                                    1
                                  }
                                </span>

                                <span className="freepdf-page-source">
                                  {
                                    file.name
                                  }
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
                      PDF ACTIONS
                    </span>

                    <h3>
                      What do you want to do?
                    </h3>

                    <p>
                      Choose an operation for
                      the PDFs currently in your
                      workspace.
                    </p>
                  </div>

                  <div className="freepdf-action-grid">
                    <button
                      type="button"
                      className="freepdf-action-card freepdf-action-primary"
                      onClick={
                        mergePDFs
                      }
                      disabled={
                        processing
                      }
                    >
                      <span>
                        Merge
                      </span>

                      <small>
                        Combine your PDFs
                      </small>

                      <b>
                        →
                      </b>
                    </button>

                    <button
                      type="button"
                      className="freepdf-action-card"
                      disabled
                    >
                      <span>
                        Split
                      </span>

                      <small>
                        Coming next
                      </small>

                      <b>
                        →
                      </b>
                    </button>

                    <button
                      type="button"
                      className="freepdf-action-card"
                      disabled
                    >
                      <span>
                        Extract
                      </span>

                      <small>
                        Coming next
                      </small>

                      <b>
                        →
                      </b>
                    </button>

                    <button
                      type="button"
                      className="freepdf-action-card"
                      disabled
                    >
                      <span>
                        Compress
                      </span>

                      <small>
                        Coming next
                      </small>

                      <b>
                        →
                      </b>
                    </button>
                  </div>
                </div>

                {processing && (
                  <div className="freepdf-processing">
                    <div className="freepdf-processing-ring">
                      <span />
                    </div>

                    <div>
                      <strong>
                        Merging your PDFs
                      </strong>

                      <p>
                        Everything is being
                        processed locally in
                        your browser.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="freepdf-success">
            <div className="freepdf-success-orbit">
              <div className="freepdf-success-check">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>
            </div>

            <span className="freepdf-preview-label">
              OPERATION COMPLETE
            </span>

            <h2>
              Your PDF is
              <br />
              <span>
                ready.
              </span>
            </h2>

            <p>
              {success.pages} pages from{" "}
              {files.length} PDFs were
              combined directly in your
              browser.
            </p>

            <div className="freepdf-result-card">
              <div className="freepdf-result-icon">
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

              <div className="freepdf-result-info">
                <strong>
                  {
                    success.filename
                  }
                </strong>

                <span>
                  {
                    success.pages
                  }{" "}
                  pages ·{" "}
                  {formatBytes(
                    success.size
                  )}
                </span>
              </div>

              <button
                type="button"
                className="freepdf-download-button"
                onClick={
                  downloadResult
                }
              >
                Download
                <span>
                  ↓
                </span>
              </button>
            </div>

            <button
              type="button"
              className="freepdf-start-again"
              onClick={
                startAgain
              }
            >
              ← Back to workspace
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
