import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PDFDocument } from "pdf-lib";

/*
  FreePDF Workspace
  - pdf-lib is the authoritative PDF engine.
  - PDF.js is optional and lazy-loaded for previews only.
  - All PDF processing stays in the browser.
  - No API/server is required.
*/

let pdfjsPromise = null;

async function loadPDFJS() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs")
      .then((pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        return pdfjsLib;
      })
      .catch((error) => {
        console.warn("[FreePDF] PDF.js could not be loaded:", error);
        pdfjsPromise = null;
        return null;
      });
  }

  return pdfjsPromise;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatNumber(number) {
  return Number(number || 0).toLocaleString();
}

function stripPdfExtension(filename) {
  return filename.replace(/\.pdf$/i, "").trim() || "Document";
}

/* ------------------------------------------------------------
   Icons
------------------------------------------------------------ */

function UploadIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17.5h.01" />
    </svg>
  );
}

/* ------------------------------------------------------------
   Range parser
------------------------------------------------------------ */

function parsePageRanges(input, totalPages) {
  const raw = String(input ?? "");

  if (!raw.trim()) {
    return {
      pages: null,
      groups: null,
      error:
        "Enter at least one page or page range, for example 1-3, 5-6.",
    };
  }

  const parts = raw.split(",");

  if (parts.some((part) => !part.trim())) {
    return {
      pages: null,
      groups: null,
      error:
        "There is an empty section in your input. Separate sections with commas, for example 1-3, 5-6.",
    };
  }

  const groups = [];
  const pages = [];
  const seen = new Set();

  for (const rawPart of parts) {
    const part = rawPart.trim();

    if (/^\d+$/.test(part)) {
      const page = Number(part);

      if (!Number.isSafeInteger(page) || page < 1) {
        return {
          pages: null,
          groups: null,
          error: "Page numbers start at 1 and must be valid numbers.",
        };
      }

      if (page > totalPages) {
        return {
          pages: null,
          groups: null,
          error: `Page ${page} is outside this PDF. This PDF contains ${totalPages} ${
            totalPages === 1 ? "page" : "pages"
          }.`,
        };
      }

      if (seen.has(page)) {
        return {
          pages: null,
          groups: null,
          error: `Page ${page} appears more than once. Remove duplicate or overlapping sections.`,
        };
      }

      seen.add(page);
      pages.push(page);
      groups.push({ start: page, end: page, pages: [page] });
      continue;
    }

    const match = part.match(/^(\d+)\s*-\s*(\d+)$/);

    if (!match) {
      return {
        pages: null,
        groups: null,
        error: `"${part}" isn't a valid section. Use formats such as 3, 2-6, or 1-3, 5-7.`,
      };
    }

    const start = Number(match[1]);
    const end = Number(match[2]);

    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 1 ||
      end < 1
    ) {
      return {
        pages: null,
        groups: null,
        error: `Range "${part}" contains an invalid page number.`,
      };
    }

    if (start > end) {
      return {
        pages: null,
        groups: null,
        error: `Range "${part}" is backwards. Use ${end}-${start} if that is what you intended.`,
      };
    }

    if (start > totalPages || end > totalPages) {
      return {
        pages: null,
        groups: null,
        error: `Range "${part}" is outside this PDF. It contains ${totalPages} ${
          totalPages === 1 ? "page" : "pages"
        }.`,
      };
    }

    const groupPages = [];

    for (let page = start; page <= end; page += 1) {
      if (seen.has(page)) {
        return {
          pages: null,
          groups: null,
          error: `Page ${page} is included more than once because your sections overlap or duplicate an earlier page.`,
        };
      }

      seen.add(page);
      pages.push(page);
      groupPages.push(page);
    }

    groups.push({ start, end, pages: groupPages });
  }

  return { pages, groups, error: "" };
}

/* ------------------------------------------------------------
   PDF page previews
------------------------------------------------------------ */

function PreviewPages({ item }) {
  const [renderedPages, setRenderedPages] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!item?.pdf) {
        setRenderedPages([]);
        return;
      }

      const pages = [];

      try {
        const count = item.pdf.numPages;

        for (let pageNumber = 1; pageNumber <= count; pageNumber += 1) {
          if (cancelled) return;

          const page = await item.pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 0.42 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          pages.push({
            pageNumber,
            dataUrl: canvas.toDataURL("image/png"),
          });
        }

        if (!cancelled) setRenderedPages(pages);
      } catch (error) {
        console.warn("[FreePDF] Preview rendering failed:", error);

        if (!cancelled) setRenderedPages([]);
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [item]);

  if (!renderedPages.length) {
    return (
      <div className="freepdf-pages-grid">
        <div className="freepdf-page-card">
          <div className="freepdf-page-preview">
            <div className="freepdf-file-icon">
              <FileIcon />
            </div>
          </div>
          <div className="freepdf-page-footer">
            <span>Preview unavailable</span>
            <span className="freepdf-page-source">{item?.name}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="freepdf-pages-grid">
      {renderedPages.map((page) => (
        <div className="freepdf-page-card" key={`${item.id}-${page.pageNumber}`}>
          <div className="freepdf-page-preview">
            <img
              className="freepdf-page-canvas"
              src={page.dataUrl}
              alt={`Page ${page.pageNumber} of ${item.name}`}
            />
            <div className="freepdf-page-glow" />
          </div>
          <div className="freepdf-page-footer">
            <span>Page {page.pageNumber}</span>
            <span className="freepdf-page-source">{item.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------
   Component
------------------------------------------------------------ */

export default function PDFWorkspace() {
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const successRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingOperation, setProcessingOperation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const [splitOpen, setSplitOpen] = useState(false);
  const [splitSourceId, setSplitSourceId] = useState("");
  const [splitMode, setSplitMode] = useState("pages");
  const [splitRanges, setSplitRanges] = useState("");

  const totalPages = useMemo(
    () => files.reduce((sum, item) => sum + (item.pages || 0), 0),
    [files]
  );

  const totalSize = useMemo(
    () => files.reduce((sum, item) => sum + (item.size || 0), 0),
    [files]
  );

  const selectedSplitSource = useMemo(
    () => files.find((item) => item.id === splitSourceId) || null,
    [files, splitSourceId]
  );

  useEffect(() => {
    return () => {
      if (success?.url) URL.revokeObjectURL(success.url);

      if (success?.outputs) {
        success.outputs.forEach((output) => {
          if (output.url) URL.revokeObjectURL(output.url);
        });
      }
    };
  }, [success]);

  useEffect(() => {
  if (!success) return;

  const frame = requestAnimationFrame(() => {
    successRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });

  return () => cancelAnimationFrame(frame);
}, [success]);

  const readPDF = useCallback(async (file) => {
    const buffer = await file.arrayBuffer();
    const pdfDocument = await PDFDocument.load(buffer);
    const pages = pdfDocument.getPageCount();

    const operationBytes = new Uint8Array(buffer.slice(0));
    let previewPdf = null;

    try {
      const pdfjsLib = await loadPDFJS();

      if (pdfjsLib) {
        const previewBytes = new Uint8Array(buffer.slice(0));
        const loadingTask = pdfjsLib.getDocument({ data: previewBytes });
        previewPdf = await loadingTask.promise;
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
      previewAvailable: Boolean(previewPdf),
    };
  }, []);

  const addFiles = useCallback(
    async (incomingFiles) => {
      const pdfFiles = Array.from(incomingFiles || {}).filter(
        (file) =>
          file &&
          (file.type === "application/pdf" || /\.pdf$/i.test(file.name))
      );

      if (!pdfFiles.length) {
        setError("Please select one or more PDF files.");
        return;
      }

      setError("");
      setSuccess(null);
      setProcessing(true);
      setProcessingOperation("Reading your PDFs");

      try {
        const loaded = [];

        for (const file of pdfFiles) {
          try {
            loaded.push(await readPDF(file));
          } catch (fileError) {
            console.error(
              "[FreePDF] Could not read PDF:",
              file.name,
              fileError
            );

            setError(
              `FreePDF couldn't read "${file.name}". The file may be damaged, encrypted, or not actually a PDF.`
            );
          }
        }

        if (loaded.length) {
          setFiles((current) => [...current, ...loaded]);
        }
      } finally {
        setProcessing(false);
        setProcessingOperation("");
      }
    },
    [readPDF]
  );

  const handleFileInput = async (event) => {
    await addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      dropZoneRef.current &&
      !dropZoneRef.current.contains(event.relatedTarget)
    ) {
      setDragActive(false);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);
    await addFiles(event.dataTransfer.files);
  };

  const removeFile = (id) => {
    setFiles((current) => current.filter((item) => item.id !== id));

    if (splitSourceId === id) {
      setSplitSourceId("");
    }

    setError("");
    setSuccess(null);
  };

  const clearFiles = () => {
    setFiles([]);
    setSplitSourceId("");
    setError("");
    setSuccess(null);
    setSplitOpen(false);
  };

  const openSplit = () => {
    if (!files.length) {
      setError("Add a PDF before splitting it.");
      return;
    }

    setError("");
    setSuccess(null);
    setSplitSourceId((current) => current || files[0]?.id || "");
    setSplitMode("pages");
    setSplitRanges("");
    setSplitOpen(true);
  };

  const closeSplit = () => {
    if (processing) return;

    setSplitOpen(false);
    setSplitRanges("");
    setError("");
  };

  const splitPDF = async () => {
    if (processing) return;

    const item =
      files.find((file) => file.id === splitSourceId) || null;

    if (!item) {
      setError("Choose a PDF to split.");
      return;
    }

    if (!item.pages) {
      setError("FreePDF couldn't determine the number of pages in this PDF.");
      return;
    }

    let groups = [];

    if (splitMode === "pages") {
      groups = Array.from({ length: item.pages }, (_, index) => ({
        start: index + 1,
        end: index + 1,
        pages: [index + 1],
      }));
    } else {
      const parsed = parsePageRanges(splitRanges, item.pages);

      if (parsed.error) {
        setError(parsed.error);
        return;
      }

      groups = parsed.groups;
    }

    if (!groups.length) {
      setError("Choose at least one section to split.");
      return;
    }

    setError("");
    setSuccess(null);
    setProcessing(true);
    setProcessingOperation("Splitting your PDF");

    try {
      const sourceBytes = new Uint8Array(item.buffer.slice(0));
      const sourcePdf = await PDFDocument.load(sourceBytes);
      const baseName = stripPdfExtension(item.name);
      const outputs = [];

      for (let index = 0; index < groups.length; index += 1) {
        const group = groups[index];
        const outputPdf = await PDFDocument.create();

        const sourceIndexes = group.pages.map(
          (pageNumber) => pageNumber - 1
        );

        const copiedPages = await outputPdf.copyPages(
          sourcePdf,
          sourceIndexes
        );

        copiedPages.forEach((page) => outputPdf.addPage(page));

        const bytes = await outputPdf.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        let filename;

        if (group.start === group.end) {
          filename = `${baseName}-Page-${String(group.start).padStart(
            2,
            "0"
          )}.pdf`;
        } else {
          filename = `${baseName}-Pages-${group.start}-${group.end}.pdf`;
        }

        outputs.push({
          id: makeId(),
          url,
          filename,
          size: bytes.byteLength,
          pages: group.pages.length,
        });
      }

      setSplitOpen(false);

      setSuccess({
        type: "split",
        sourceName: item.name,
        outputs,
      });
    } catch (splitError) {
      console.error("[FreePDF] PDF split failed:", splitError);

      setError(
        "FreePDF couldn't split this PDF. It may be encrypted, damaged, or unsupported by pdf-lib."
      );
    } finally {
      setProcessing(false);
      setProcessingOperation("");
    }
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError("Add at least two PDF files to merge them.");
      return;
    }

    setError("");
    setSuccess(null);
    setProcessing(true);
    setProcessingOperation("Merging your PDFs");

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const sourceBytes = new Uint8Array(item.buffer.slice(0));
        const sourcePdf = await PDFDocument.load(sourceBytes);

        const copiedPages = await mergedPdf.copyPages(
          sourcePdf,
          sourcePdf.getPageIndices()
        );

        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      setSuccess({
        type: "merge",
        url,
        filename: "FreeToolz-Merged.pdf",
        size: mergedBytes.byteLength,
        pages: totalPages,
      });
    } catch (mergeError) {
      console.error("[FreePDF] PDF merge failed:", mergeError);

      setError(
        "FreePDF couldn't merge these files. One of the PDFs may be encrypted, damaged, or unsupported by pdf-lib."
      );
    } finally {
      setProcessing(false);
      setProcessingOperation("");
    }
  };

  const downloadOutput = (output) => {
    if (!output?.url) return;

    const link = document.createElement("a");
    link.href = output.url;
    link.download = output.filename || "FreeToolz.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const startAgain = () => {
    if (success?.url) URL.revokeObjectURL(success.url);

    if (success?.outputs) {
      success.outputs.forEach((output) => {
        if (output.url) URL.revokeObjectURL(output.url);
      });
    }

    setSuccess(null);
    setError("");
    setSplitOpen(false);
  };

  /* ------------------------------------------------------------
     Success state
  ------------------------------------------------------------ */

  if (success?.type === "split") {
    return (
      <section ref={successRef} className="freepdf-success">
        <div className="freepdf-success-orbit">
          <div className="freepdf-success-check">
            <CheckIcon />
          </div>
        </div>

        <span className="freepdf-eyebrow">SPLIT COMPLETE</span>

        <h2>
          <span>Your PDF has been split.</span>
        </h2>

        <p>
          {success.outputs?.length || 0} separate PDF {
            success.outputs?.length === 1 ? "file is" : "files are"
          } ready to download.
        </p>

        <div
          style={{
            width: "min(650px, 100%)",
            display: "grid",
            gap: 10,
            marginTop: 35,
          }}
        >
          {success.outputs?.map((output) => (
            <div
              className="freepdf-result-card"
              key={output.id}
              style={{ marginTop: 0, width: "100%", boxSizing: "border-box" }}
            >
              <div className="freepdf-result-icon">
                <FileIcon />
              </div>

              <div className="freepdf-result-info">
                <strong title={output.filename}>
                  {output.filename}
                </strong>
                <span>
                  {output.pages} {
                    output.pages === 1 ? "page" : "pages"
                  } · {formatBytes(output.size)}
                </span>
              </div>

              <button
                type="button"
                className="freepdf-download-button"
                onClick={() => downloadOutput(output)}
              >
                <DownloadIcon />
                <span>Download</span>
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="freepdf-start-again"
          onClick={startAgain}
        >
          Back
        </button>
      </section>
    );
  }

  if (success?.type === "merge") {
    return (
      <section ref={successRef} className="freepdf-success">
        <div className="freepdf-success-orbit">
          <div className="freepdf-success-check">
            <CheckIcon />
          </div>
        </div>

        <span className="freepdf-eyebrow">MERGE COMPLETE</span>

        <h2>
          <span>Your PDFs are merged.</span>
        </h2>

        <p>Your new PDF is ready to download.</p>

        <div className="freepdf-result-card">
          <div className="freepdf-result-icon">
            <FileIcon />
          </div>

          <div className="freepdf-result-info">
            <strong title={success.filename}>
              {success.filename}
            </strong>
            <span>
              {formatNumber(success.pages)} pages · {formatBytes(success.size)}
            </span>
          </div>

          <button
            type="button"
            className="freepdf-download-button"
            onClick={() => downloadOutput(success)}
          >
            <DownloadIcon />
            <span>Download</span>
          </button>
        </div>

        <button
          type="button"
          className="freepdf-start-again"
          onClick={startAgain}
        >
          Back
        </button>
      </section>
    );
  }

  return (
    <section className="freepdf-workspace" id = "workspace">
      <div className="freepdf-workspace-inner">
        <div
          ref={dropZoneRef}
          className={`freepdf-dropzone ${
            dragActive ? "is-dragging" : ""
          } ${files.length ? "has-files" : ""}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="freepdf-upload-icon">
            <div className="freepdf-upload-icon-inner">
              <UploadIcon />
            </div>
          </div>

          <div className="freepdf-upload-copy">
            <h3>Drop your PDFs here</h3>
            <p>or choose files from your device</p>
          </div>

          <button
            type="button"
            className="freepdf-browse-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            Choose PDF files
            <span>↗</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={handleFileInput}
          />

          <div className="freepdf-upload-meta">
            <span>PDF files</span>
            <i />
            <span>Processed privately in your browser</span>
          </div>

          {processing && (
            <div className="freepdf-loading">
              <span className="freepdf-spinner" />
              <span>{processingOperation || "Processing..."}</span>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <>
            <div className="freepdf-workspace-header">
              <div>
                <span className="freepdf-eyebrow">YOUR DOCUMENTS</span>
                <h2>PDF Workspace</h2>
                <p>Your files stay in your browser.</p>
              </div>

              <button
                type="button"
                className="freepdf-clear-button"
                onClick={clearFiles}
                disabled={processing}
              >
                Clear all
              </button>
            </div>

            <div className="freepdf-stats">
              <div className="freepdf-stat">
                <span>PDFs</span>
                <strong>{formatNumber(files.length)}</strong>
              </div>

              <div className="freepdf-stat-divider" />

              <div className="freepdf-stat">
                <span>Pages</span>
                <strong>{formatNumber(totalPages)}</strong>
              </div>

              <div className="freepdf-stat-divider" />

              <div className="freepdf-stat">
                <span>Total size</span>
                <strong>{formatBytes(totalSize)}</strong>
              </div>
            </div>

            <div className="freepdf-file-list">
              {files.map((item, index) => (
                <div className="freepdf-file-card" key={item.id}>
                  <span className="freepdf-file-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="freepdf-file-icon">
                    <FileIcon />
                  </div>

                  <div className="freepdf-file-info">
                    <strong title={item.name}>{item.name}</strong>
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
                    disabled={processing}
                    aria-label={`Remove ${item.name}`}
                  >
                    <XIcon />
                  </button>
                </div>
              ))}
            </div>

            <div className="freepdf-preview-shell">
              <div className="freepdf-preview-header">
                <div>
                  <span className="freepdf-preview-label">
                    <span className="freepdf-eyebrow-dot" />
                    LIVE PREVIEW
                  </span>
                  <h3>Document pages</h3>
                </div>

                <span className="freepdf-preview-count">
                  {formatNumber(totalPages)}{" "}
                  {totalPages === 1 ? "PAGE" : "PAGES"}
                </span>
              </div>

              {files.map((item) => (
                <PreviewPages item={item} key={item.id} />
              ))}
            </div>

            {!splitOpen ? (
              <div className="freepdf-action-panel">
                <div>
                  <span className="freepdf-eyebrow">PDF TOOLS</span>
                  <h3>What would you like to do?</h3>
                  <p>
                    Merge documents together or split a PDF into separate
                    downloadable files.
                  </p>
                  {error && (
  <div className="freepdf-error">
    <span>
      <AlertIcon />
    </span>

    <div>
      <strong>Something needs attention</strong>
      <p>{error}</p>
    </div>
<button
  type="button"
  className="freepdf-error-dismiss"
  onClick={() => setError("")}
  aria-label="Dismiss error"
>
  <XIcon />
</button>
  </div>
)}
                </div>

                <div className="freepdf-action-grid">
                  <button
                    type="button"
                    className="freepdf-action-card freepdf-action-primary"
                    onClick={mergePDFs}
                    disabled={files.length < 2 || processing}
                  >
                    <span>Merge</span>
                    <small>Combine multiple PDFs into one</small>
                    <b><ChevronIcon /></b>
                  </button>

                  <button
                    type="button"
                    className="freepdf-action-card freepdf-action-primary"
                    onClick={openSplit}
                    disabled={files.length === 0 || processing}
                  >
                    <span>Split</span>
                    <small>Divide a PDF into separate parts</small>
                    <b><ChevronIcon /></b>
                  </button>

                  <button
                    type="button"
                    className="freepdf-action-card"
                    disabled
                  >
                    <span>Extract</span>
                    <small>Coming next</small>
                    <b><ChevronIcon /></b>
                  </button>

                  <button
                    type="button"
                    className="freepdf-action-card"
                    disabled
                  >
                    <span>Compress</span>
                    <small>Coming next</small>
                    <b><ChevronIcon /></b>
                  </button>
                </div>
              </div>
            ) : (
              <div className="freepdf-action-panel">
                <div>
                  <span className="freepdf-eyebrow">SPLIT PDF</span>
                  <h3>Divide your PDF</h3>
                  <p>
                    Choose a document and decide how its pages should be
                    separated. Everything stays in your browser.
                  </p>
                  {error && (
  <div className="freepdf-error">
    <span>
      <AlertIcon />
    </span>

    <div>
      <strong>Something needs attention</strong>
      <p>{error}</p>
    </div>
    <button
      type="button"
      onClick={() => setError("")}
      aria-label="Dismiss error"
    >
      <XIcon />
    </button>
  </div>
)}
                </div>

                <div>
                  <div className="freepdf-action-grid">
                    <button
                      type="button"
                      className={`freepdf-action-card ${
                        splitMode === "pages"
                          ? "freepdf-action-primary"
                          : ""
                      }`}
                      onClick={() => setSplitMode("pages")}
                      disabled={processing}
                    >
                      <span>Every page</span>
                      <small>One PDF for each page</small>
                      <b>
                        {splitMode === "pages" ? "✓" : <ChevronIcon />}
                      </b>
                    </button>

                    <button
                      type="button"
                      className={`freepdf-action-card ${
                        splitMode === "ranges"
                          ? "freepdf-action-primary"
                          : ""
                      }`}
                      onClick={() => setSplitMode("ranges")}
                      disabled={processing}
                    >
                      <span>Custom ranges</span>
                      <small>Choose sections to create</small>
                      <b>
                        {splitMode === "ranges" ? "✓" : <ChevronIcon />}
                      </b>
                    </button>
                  </div>

                  <div
                    className="freepdf-result-card"
                    style={{ marginTop: 12, width: "100%", boxSizing: "border-box" }}
                  >
                    <div className="freepdf-result-icon">
                      <FileIcon />
                    </div>

                    <div className="freepdf-result-info">
                      <strong>PDF to split</strong>
                      <span>
                        {selectedSplitSource?.name || "Choose a document"}
                      </span>
                    </div>
                  </div>

                  <div
                    className="freepdf-action-grid"
                    style={{ marginTop: 11 }}
                  >
                    {files.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`freepdf-action-card ${
                          item.id === splitSourceId
                            ? "freepdf-action-primary"
                            : ""
                        }`}
                        onClick={() => setSplitSourceId(item.id)}
                        disabled={processing}
                      >
                        <span>{item.name}</span>
                        <small>
                          {item.pages} {item.pages === 1 ? "page" : "pages"} · {formatBytes(item.size)}
                        </small>
                        <b>
                          {item.id === splitSourceId ? "✓" : <ChevronIcon />}
                        </b>
                      </button>
                    ))}
                  </div>

                  {splitMode === "ranges" && (
                    <div
                      className="freepdf-result-card"
                      style={{
                        marginTop: 11,
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      <div className="freepdf-result-icon">
                        <span style={{ fontSize: 16, fontWeight: 800 }}>#</span>
                      </div>

                      <div className="freepdf-result-info">
                        <strong>Page ranges</strong>
                        <span>Example: 1-3, 5-7, 10</span>
                        <input
                          type="text"
                          value={splitRanges}
                          onChange={(event) => setSplitRanges(event.target.value)}
                          placeholder="1-3, 5-7, 10"
                          disabled={processing}
                          aria-label="Page ranges"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            marginTop: 9,
                            minHeight: 42,
                            padding: "0 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(202,219,212,0.12)",
                            background: "rgba(255,255,255,0.035)",
                            color: "#edf6f2",
                            outline: "none",
                            font: "inherit",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {selectedSplitSource && (
                    <div
                      style={{
                        marginTop: 13,
                        color: "rgba(200,218,210,0.48)",
                        fontSize: 10,
                        lineHeight: 1.5,
                      }}
                    >
                      {splitMode === "pages"
                        ? `This will create ${selectedSplitSource.pages} PDF ${selectedSplitSource.pages === 1 ? "file" : "files"}.`
                        : "Each comma-separated section becomes a separate PDF."}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 18,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={closeSplit}
                      disabled={processing}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={splitPDF}
                      disabled={processing || !selectedSplitSource}
                    >
                      {processing ? "Splitting..." : "Split PDF"}
                      {!processing && <ChevronIcon />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!files.length && !processing && (
          <div
            className="freepdf-file-card"
            style={{
              marginTop: 24,
              justifyContent: "center",
              flexDirection: "column",
              textAlign: "center",
              padding: "28px",
            }}
          >
            <div className="freepdf-file-icon">
              <FileIcon />
            </div>

            <div className="freepdf-file-info">
              <strong>Your PDF workspace</strong>
              <span>
                Add one or more PDF files above to start working with them.
              </span>
            </div>
          </div>
        )}

        {processing && files.length > 0 && (
          <div className="freepdf-processing">
            <div className="freepdf-processing-ring">
              <span />
            </div>

            <div>
              <strong>
                {processingOperation || "Processing your PDF"}
              </strong>
              <p>Everything is being processed locally in your browser.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
