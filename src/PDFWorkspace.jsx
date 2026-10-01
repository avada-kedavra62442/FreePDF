
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
 * Convert a filename into a safe base name.
 *
 * Example:
 * "My Report.pdf"
 * -> "My Report"
 */
const getBaseName = (filename) =>
  filename
    .replace(/\.pdf$/i, "")
    .trim() || "Document";

/*
 * Convert page/range input into a list of page numbers.
 *
 * Examples:
 *
 * "1-3"
 * -> [1, 2, 3]
 *
 * "1-3, 7, 9-10"
 * -> [1, 2, 3, 7, 9, 10]
 */
function parsePageRanges(input, totalPages) {
  const value = String(input || "").trim();

  if (!value) {
    return {
      pages: null,
      error:
        "Enter at least one page or page range, for example 1-3, 5, 8-10.",
    };
  }

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return {
      pages: null,
      error:
        "Enter at least one page or page range, for example 1-3, 5, 8-10.",
    };
  }

  const pages = [];
  const seen = new Set();

  for (const part of parts) {
    /*
     * Single page:
     * "5"
     */
    if (/^\d+$/.test(part)) {
      const page = Number(part);

      if (
        page < 1 ||
        page > totalPages
      ) {
        return {
          pages: null,
          error: `Page ${page} is outside this PDF. It contains ${totalPages} ${
            totalPages === 1 ? "page" : "pages"
          }.`,
        };
      }

      if (seen.has(page)) {
        return {
          pages: null,
          error: `Page ${page} appears more than once. Remove duplicate pages or overlapping ranges.`,
        };
      }

      seen.add(page);
      pages.push(page);
      continue;
    }

    /*
     * Range:
     * "3-7"
     */
    const rangeMatch =
      part.match(/^(\d+)\s*-\s*(\d+)$/);

    if (rangeMatch) {
      const start = Number(
        rangeMatch[1]
      );

      const end = Number(
        rangeMatch[2]
      );

      if (
        start < 1 ||
        end < 1 ||
        start > totalPages ||
        end > totalPages
      ) {
        return {
          pages: null,
          error: `Range "${part}" is outside this PDF. It contains ${totalPages} ${
            totalPages === 1 ? "page" : "pages"
          }.`,
        };
      }

      if (start > end) {
        return {
          pages: null,
          error: `Range "${part}" is backwards. Use ${end}-${start} instead.`,
        };
      }

      for (
        let page = start;
        page <= end;
        page += 1
      ) {
        if (seen.has(page)) {
          return {
            pages: null,
            error: `Page ${page} is included more than once because your ranges overlap.`,
          };
        }

        seen.add(page);
        pages.push(page);
      }

      continue;
    }

    return {
      pages: null,
      error: `"${part}" isn't a valid page or range. Use formats such as 3 or 2-6.`,
    };
  }

  return {
    pages,
    error: "",
  };
}

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

  /*
   * SPLIT STATE
   *
   * splitOpen:
   * Shows the Split configuration panel.
   *
   * splitSourceId:
   * Which uploaded PDF should be split.
   *
   * splitMode:
   * "pages"  = every page becomes its own PDF.
   * "ranges" = custom ranges become separate PDFs.
   *
   * splitRanges:
   * User-entered page/range expression.
   */
  const [splitOpen, setSplitOpen] =
    useState(false);

  const [splitSourceId, setSplitSourceId] =
    useState("");

  const [splitMode, setSplitMode] =
    useState("pages");

  const [splitRanges, setSplitRanges] =
    useState("");

  /*
   * Add files.
   */
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

    /*
     * If the removed file was selected
     * for Split, reset the selection.
     */
    setSplitSourceId(
      (current) =>
        current === id
          ? ""
          : current
    );

    setSuccess(null);
  };

  const clearAll = () => {
    /*
     * Revoke generated result URLs
     * before clearing them.
     */
    if (success?.outputs) {
      success.outputs.forEach(
        (output) => {
          if (output.url) {
            URL.revokeObjectURL(
              output.url
            );
          }
        }
      );
    }

    if (success?.url) {
      URL.revokeObjectURL(
        success.url
      );
    }

    setFiles([]);
    setError("");
    setSuccess(null);
    setSplitOpen(false);
    setSplitSourceId("");
    setSplitRanges("");
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
            mergedPdf.addPage(
              page
            );
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
        operation: "merge",
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

  /*
   * OPEN SPLIT
   *
   * Split works on ONE PDF at a time.
   */
  const openSplit = () => {
    if (!files.length) {
      setError(
        "Add a PDF before splitting it."
      );

      return;
    }

    setError("");
    setSuccess(null);

    /*
     * Default to the first PDF.
     */
    setSplitSourceId(
      (current) =>
        current ||
        files[0]?.id ||
        ""
    );

    setSplitMode("pages");
    setSplitRanges("");
    setSplitOpen(true);
  };

  /*
   * CLOSE SPLIT CONFIGURATION.
   */
  const closeSplit = () => {
    if (processing) return;

    setSplitOpen(false);
    setError("");
  };

  /*
   * SPLIT PDF
   *
   * "pages":
   * Every page becomes a separate PDF.
   *
   * "ranges":
   * Every comma-separated page/range expression
   * becomes a separate PDF.
   *
   * Example:
   *
   * 1-3, 4-7, 8-12
   *
   * produces:
   *
   * pages 1-3
   * pages 4-7
   * pages 8-12
   */
  const splitPDF = async () => {
    if (!splitSourceId) {
      setError(
        "Choose a PDF to split."
      );

      return;
    }

    const source =
      files.find(
        (item) =>
          item.id ===
          splitSourceId
      );

    if (!source) {
      setError(
        "The selected PDF is no longer available. Choose another PDF."
      );

      return;
    }

    setError("");
    setSuccess(null);
    setProcessing(true);

    try {
      /*
       * Reload from a fresh independent byte copy.
       */
      const sourceBytes =
        new Uint8Array(
          source.buffer.slice(0)
        );

      const sourcePdf =
        await PDFDocument.load(
          sourceBytes
        );

      const pageCount =
        sourcePdf.getPageCount();

      let groups = [];

      /*
       * MODE 1:
       * Every page gets its own output.
       */
      if (splitMode === "pages") {
        groups = Array.from(
          {
            length:
              pageCount,
          },
          (_, index) => [
            index + 1,
          ]
        );
      }

      /*
       * MODE 2:
       * User-defined ranges.
       */
      if (splitMode === "ranges") {
        const parsed =
          parsePageRanges(
            splitRanges,
            pageCount
          );

        if (parsed.error) {
          setError(
            parsed.error
          );

          setProcessing(false);

          return;
        }

        /*
         * Turn each comma-separated
         * section into its own group.
         *
         * We parse again here because the
         * validation function intentionally
         * returns the flattened page list.
         */
        groups =
          splitRanges
            .split(",")
            .map(
              (part) =>
                part.trim()
            )
            .filter(Boolean)
            .map(
              (part) => {
                if (
                  /^\d+$/.test(
                    part
                  )
                ) {
                  return [
                    Number(part),
                  ];
                }

                const match =
                  part.match(
                    /^(\d+)\s*-\s*(\d+)$/
                  );

                if (!match) {
                  return [];
                }

                const start =
                  Number(
                    match[1]
                  );

                const end =
                  Number(
                    match[2]
                  );

                return Array.from(
                  {
                    length:
                      end -
                      start +
                      1,
                  },
                  (
                    _,
                    index
                  ) =>
                    start +
                    index
                );
              }
            );
      }

      if (!groups.length) {
        setError(
          "No pages were selected for splitting."
        );

        setProcessing(false);

        return;
      }

      const baseName =
        getBaseName(
          source.name
        );

      const outputs = [];

      /*
       * Create every requested PDF.
       */
      for (
        let index = 0;
        index < groups.length;
        index += 1
      ) {
        const pageNumbers =
          groups[index];

        if (
          !pageNumbers.length
        ) {
          continue;
        }

        const outputPdf =
          await PDFDocument.create();

        const zeroBasedIndices =
          pageNumbers.map(
            (page) =>
              page - 1
          );

        const copiedPages =
          await outputPdf.copyPages(
            sourcePdf,
            zeroBasedIndices
          );

        copiedPages.forEach(
          (page) => {
            outputPdf.addPage(
              page
            );
          }
        );

        const outputBytes =
          await outputPdf.save();

        const blob =
          new Blob(
            [outputBytes],
            {
              type:
                "application/pdf",
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        /*
         * Filename examples:
         *
         * Report-Page-01.pdf
         * Report-Pages-1-3.pdf
         */
        let suffix = "";

        if (
          pageNumbers.length ===
          1
        ) {
          suffix =
            `Page-${String(
              pageNumbers[0]
            ).padStart(
              2,
              "0"
            )}`;
        } else {
          suffix =
            `Pages-${pageNumbers[0]}-${pageNumbers[
              pageNumbers.length -
                1
            ]}`;
        }

        outputs.push({
          id: makeId(),
          url,
          filename:
            `${baseName}-${suffix}.pdf`,
          size:
            outputBytes.byteLength,
          pages:
            pageNumbers.length,
          pageNumbers,
        });
      }

      setSplitOpen(false);

      setSuccess({
        operation: "split",
        sourceName:
          source.name,
        sourcePages:
          pageCount,
        outputs,
        totalOutputPages:
          outputs.reduce(
            (total, output) =>
              total +
              output.pages,
            0
          ),
      });
    } catch (splitError) {
      console.error(
        "[FreePDF] PDF split failed:",
        splitError
      );

      setError(
        "FreePDF couldn't split this PDF. It may be encrypted, damaged, or unsupported by pdf-lib."
      );
    } finally {
      setProcessing(false);
    }
  };

  /*
   * Download one Split output.
   */
  const downloadSplitOutput = (
    output
  ) => {
    if (!output?.url) return;

    const link =
      document.createElement("a");

    link.href =
      output.url;

    link.download =
      output.filename;

    link.rel =
      "noopener";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();
  };

  /*
   * Download Merge result.
   */
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

  /*
   * Return to the workspace.
   */
  const startAgain = () => {
    /*
     * Revoke all generated URLs.
     */
    if (success?.outputs) {
      success.outputs.forEach(
        (output) => {
          if (output.url) {
            URL.revokeObjectURL(
              output.url
            );
          }
        }
      );
    }

    if (success?.url) {
      URL.revokeObjectURL(
        success.url
      );
    }

    setSuccess(null);
    setError("");
    setSplitOpen(false);
  };

  /*
   * Cleanup generated object URLs
   * if the component itself is removed.
   */
  useEffect(() => {
    return () => {
      if (success?.outputs) {
        success.outputs.forEach(
          (output) => {
            if (output.url) {
              URL.revokeObjectURL(
                output.url
              );
            }
          }
        );
      }

      if (success?.url) {
        URL.revokeObjectURL(
          success.url
        );
      }
    };
  }, [success]);

  /*
   * Find currently selected Split PDF.
   */
  const splitSource =
    files.find(
      (item) =>
        item.id ===
        splitSourceId
    );

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

                {!splitOpen && (
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
                        onClick={
                          openSplit
                        }
                        disabled={
                          processing
                        }
                      >
                        <span>
                          Split
                        </span>

                        <small>
                          Divide a PDF into parts
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
                )}

                {splitOpen && (
                  <div
                    className="freepdf-action-panel"
                    style={{
                      marginTop:
                        "24px",
                    }}
                  >
                    <div>
                      <span className="freepdf-preview-label">
                        SPLIT PDF
                      </span>

                      <h3>
                        Divide your document.
                      </h3>

                      <p>
                        Choose one PDF and decide
                        how its pages should be
                        separated. Everything stays
                        inside your browser.
                      </p>
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gap:
                          "18px",
                        marginTop:
                          "24px",
                      }}
                    >
                      <div>
                        <label
                          htmlFor="freepdf-split-source"
                          style={{
                            display:
                              "block",
                            marginBottom:
                              "8px",
                            fontSize:
                              "12px",
                            fontWeight:
                              700,
                            letterSpacing:
                              "0.12em",
                            textTransform:
                              "uppercase",
                            opacity:
                              0.65,
                          }}
                        >
                          SOURCE PDF
                        </label>

                        <select
                          id="freepdf-split-source"
                          value={
                            splitSourceId
                          }
                          onChange={(
                            event
                          ) =>
                            setSplitSourceId(
                              event
                                .target
                                .value
                            )
                          }
                          style={{
                            width:
                              "100%",
                            minHeight:
                              "48px",
                            padding:
                              "0 14px",
                            borderRadius:
                              "12px",
                            border:
                              "1px solid rgba(255,255,255,0.14)",
                            background:
                              "rgba(255,255,255,0.06)",
                            color:
                              "inherit",
                            font:
                              "inherit",
                            outline:
                              "none",
                          }}
                        >
                          {files.map(
                            (
                              file
                            ) => (
                              <option
                                key={
                                  file.id
                                }
                                value={
                                  file.id
                                }
                                style={{
                                  background:
                                    "#101916",
                                  color:
                                    "#fff",
                                }}
                              >
                                {
                                  file.name
                                }{" "}
                                —{" "}
                                {
                                  file.pages
                                }{" "}
                                {file.pages ===
                                1
                                  ? "page"
                                  : "pages"}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display:
                              "block",
                            marginBottom:
                              "10px",
                            fontSize:
                              "12px",
                            fontWeight:
                              700,
                            letterSpacing:
                              "0.12em",
                            textTransform:
                              "uppercase",
                            opacity:
                              0.65,
                          }}
                        >
                          SPLIT METHOD
                        </label>

                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(210px, 1fr))",
                            gap:
                              "12px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSplitMode(
                                "pages"
                              )
                            }
                            style={{
                              textAlign:
                                "left",
                              padding:
                                "18px",
                              borderRadius:
                                "14px",
                              border:
                                splitMode ===
                                "pages"
                                  ? "1px solid rgba(0,255,170,0.5)"
                                  : "1px solid rgba(255,255,255,0.1)",
                              background:
                                splitMode ===
                                "pages"
                                  ? "rgba(0,255,170,0.08)"
                                  : "rgba(255,255,255,0.035)",
                              color:
                                "inherit",
                              cursor:
                                "pointer",
                              font:
                                "inherit",
                            }}
                          >
                            <strong
                              style={{
                                display:
                                  "block",
                                marginBottom:
                                  "6px",
                              }}
                            >
                              Every page
                            </strong>

                            <span
                              style={{
                                display:
                                  "block",
                                fontSize:
                                  "12px",
                                opacity:
                                  0.62,
                                lineHeight:
                                  1.5,
                              }}
                            >
                              Create one separate
                              PDF for every page.
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setSplitMode(
                                "ranges"
                              )
                            }
                            style={{
                              textAlign:
                                "left",
                              padding:
                                "18px",
                              borderRadius:
                                "14px",
                              border:
                                splitMode ===
                                "ranges"
                                  ? "1px solid rgba(0,255,170,0.5)"
                                  : "1px solid rgba(255,255,255,0.1)",
                              background:
                                splitMode ===
                                "ranges"
                                  ? "rgba(0,255,170,0.08)"
                                  : "rgba(255,255,255,0.035)",
                              color:
                                "inherit",
                              cursor:
                                "pointer",
                              font:
                                "inherit",
                            }}
                          >
                            <strong
                              style={{
                                display:
                                  "block",
                                marginBottom:
                                  "6px",
                              }}
                            >
                              Custom ranges
                            </strong>

                            <span
                              style={{
                                display:
                                  "block",
                                fontSize:
                                  "12px",
                                opacity:
                                  0.62,
                                lineHeight:
                                  1.5,
                              }}
                            >
                              Separate the PDF using
                              page ranges.
                            </span>
                          </button>
                        </div>
                      </div>

                      {splitMode ===
                        "ranges" && (
                        <div>
                          <label
                            htmlFor="freepdf-split-ranges"
                            style={{
                              display:
                                "block",
                              marginBottom:
                                "8px",
                              fontSize:
                                "12px",
                              fontWeight:
                                700,
                              letterSpacing:
                                "0.12em",
                              textTransform:
                                "uppercase",
                              opacity:
                                0.65,
                            }}
                          >
                            PAGE RANGES
                          </label>

                          <input
                            id="freepdf-split-ranges"
                            type="text"
                            value={
                              splitRanges
                            }
                            onChange={(
                              event
                            ) =>
                              setSplitRanges(
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Example: 1-3, 4-7, 8-12"
                            style={{
                              width:
                                "100%",
                              minHeight:
                                "48px",
                              padding:
                                "0 14px",
                              borderRadius:
                                "12px",
                              border:
                                "1px solid rgba(255,255,255,0.14)",
                              background:
                                "rgba(255,255,255,0.06)",
                              color:
                                "inherit",
                              font:
                                "inherit",
                              outline:
                                "none",
                              boxSizing:
                                "border-box",
                            }}
                          />

                          <p
                            style={{
                              margin:
                                "9px 0 0",
                              fontSize:
                                "12px",
                              opacity:
                                0.55,
                              lineHeight:
                                1.5,
                            }}
                          >
                            Each comma-separated
                            section becomes its own
                            PDF. Example:
                            <strong>
                              {" "}
                              1-3, 4-7, 8-12
                            </strong>
                            .
                          </p>
                        </div>
                      )}

                      {splitSource && (
                        <div
                          style={{
                            padding:
                              "14px 16px",
                            borderRadius:
                              "12px",
                            background:
                              "rgba(0,255,170,0.045)",
                            border:
                              "1px solid rgba(0,255,170,0.12)",
                            fontSize:
                              "13px",
                            lineHeight:
                              1.5,
                          }}
                        >
                          <strong>
                            {
                              splitSource.name
                            }
                          </strong>

                          <span
                            style={{
                              opacity:
                                0.55,
                              marginLeft:
                                "8px",
                            }}
                          >
                            {
                              splitSource.pages
                            }{" "}
                            {splitSource.pages ===
                            1
                              ? "page"
                              : "pages"}{" "}
                            ·{" "}
                            {formatBytes(
                              splitSource.size
                            )}
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          gap:
                            "10px",
                          justifyContent:
                            "flex-end",
                        }}
                      >
                        <button
                          type="button"
                          className="freepdf-action-card"
                          onClick={
                            closeSplit
                          }
                          disabled={
                            processing
                          }
                          style={{
                            minHeight:
                              "58px",
                          }}
                        >
                          <span>
                            Cancel
                          </span>

                          <small>
                            Back to actions
                          </small>

                          <b>
                            ×
                          </b>
                        </button>

                        <button
                          type="button"
                          className="freepdf-action-card freepdf-action-primary"
                          onClick={
                            splitPDF
                          }
                          disabled={
                            processing
                          }
                          style={{
                            minHeight:
                              "58px",
                          }}
                        >
                          <span>
                            Split PDF
                          </span>

                          <small>
                            Process locally
                          </small>

                          <b>
                            →
                          </b>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {processing && (
                  <div className="freepdf-processing">
                    <div className="freepdf-processing-ring">
                      <span />
                    </div>

                    <div>
                      <strong>
                        {splitOpen
                          ? "Splitting your PDF"
                          : "Merging your PDFs"}
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
        ) : success.operation ===
          "split" ? (
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
              SPLIT COMPLETE
            </span>

            <h2>
              Your PDF has been
              <br />
              <span>
                split.
              </span>
            </h2>

            <p>
              {success.sourcePages} pages from{" "}
              <strong>
                {success.sourceName}
              </strong>{" "}
              were processed locally in your
              browser.
            </p>

            <div
              className="freepdf-result-card"
              style={{
                marginBottom:
                  "18px",
              }}
            >
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
                    success.outputs.length
                  }{" "}
                  output{" "}
                  {success.outputs.length ===
                  1
                    ? "PDF"
                    : "PDFs"}
                </strong>

                <span>
                  {
                    success.totalOutputPages
                  }{" "}
                  output{" "}
                  {
                    success.totalOutputPages ===
                    1
                      ? "page"
                      : "pages"
                  }
                </span>
              </div>
            </div>

            <div
              style={{
                display:
                  "grid",
                gap:
                  "10px",
                width:
                  "100%",
                maxWidth:
                  "760px",
                margin:
                  "0 auto 24px",
                textAlign:
                  "left",
              }}
            >
              {success.outputs.map(
                (
                  output,
                  index
                ) => (
                  <div
                    key={
                      output.id
                    }
                    className="freepdf-result-card"
                    style={{
                      margin:
                        0,
                    }}
                  >
                    <div className="freepdf-result-icon">
                      <span
                        style={{
                          fontSize:
                            "11px",
                          fontWeight:
                            800,
                          letterSpacing:
                            "0.04em",
                        }}
                      >
                        {String(
                          index +
                            1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>
                    </div>

                    <div className="freepdf-result-info">
                      <strong
                        title={
                          output.filename
                        }
                      >
                        {
                          output.filename
                        }
                      </strong>

                      <span>
                        {
                          output.pages
                        }{" "}
                        {output.pages ===
                        1
                          ? "page"
                          : "pages"}{" "}
                        ·{" "}
                        {formatBytes(
                          output.size
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="freepdf-download-button"
                      onClick={() =>
                        downloadSplitOutput(
                          output
                        )
                      }
                    >
                      Download
                      <span>
                        ↓
                      </span>
                    </button>
                  </div>
                )
              )}
            </div>

            <p
              style={{
                fontSize:
                  "12px",
                opacity:
                  0.48,
                maxWidth:
                  "650px",
                margin:
                  "0 auto 20px",
                lineHeight:
                  1.6,
              }}
            >
              Each output is available separately.
              This keeps downloads reliable across
              desktop browsers, iPhone and iPad.
            </p>

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
