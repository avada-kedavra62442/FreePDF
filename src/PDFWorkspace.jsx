import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PDFDocument } from "pdf-lib";

import { compressPDF } from "./utils/compressPDF";
import { mergePDF } from "./utils/mergePDF";
import { splitPDF } from "./utils/splitPDF";

/*
  FreePDF Workspace / Tool Pages

  Modes:
    workspace
    merge
    split
    compress
    pdf-to-image
    image-to-pdf
    rearrange
    delete-pages
    extract-pages
    rotate
    page-numbers
    watermark
    remove-watermark
    sign
    fill-forms
    password-protect
    metadata

  Merge / Split / Compress are currently functional.
  Other routes intentionally show a "coming next" state
  until their actual PDF engine is implemented.
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

  return `${value.toFixed(
    value >= 100 || index === 0 ? 0 : 1
  )} ${units[index]}`;
}

function formatNumber(number) {
  return Number(number || 0).toLocaleString();
}

function stripPdfExtension(filename) {
  return filename.replace(/\.pdf$/i, "").trim() || "Document";
}

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------------------------------------
   Icons
------------------------------------------------------------ */

function UploadIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
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
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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

      groups.push({
        start: page,
        end: page,
        pages: [page],
      });

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

    groups.push({
      start,
      end,
      pages: groupPages,
    });
  }

  return {
    pages,
    groups,
    error: "",
  };
}

/* ------------------------------------------------------------
   Preview
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

        if (!cancelled) {
          setRenderedPages(pages);
        }
      } catch (error) {
        console.warn("[FreePDF] Preview rendering failed:", error);

        if (!cancelled) {
          setRenderedPages([]);
        }
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
        <div
          className="freepdf-page-card"
          key={`${item.id}-${page.pageNumber}`}
        >
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
   Tool metadata
------------------------------------------------------------ */

const TOOL_INFO = {
  "pdf-to-image": {
    eyebrow: "PDF → IMAGE",
    title: "Turn PDF pages into images.",
    description:
      "Convert PDF pages into clean JPG or PNG images directly in your browser.",
  },
  "image-to-pdf": {
    eyebrow: "IMAGE → PDF",
    title: "Turn images into a PDF.",
    description:
      "Combine JPG and PNG images into a clean PDF document.",
  },
  rearrange: {
    eyebrow: "REARRANGE PAGES",
    title: "Put your pages in the right order.",
    description:
      "Reorder PDF pages exactly how you want them.",
  },
  "delete-pages": {
    eyebrow: "DELETE PAGES",
    title: "Remove pages you don't need.",
    description:
      "Delete selected pages from an existing PDF.",
  },
  extract: {
    eyebrow: "EXTRACT PAGES",
    title: "Pull pages into a new PDF.",
    description:
      "Extract selected pages or ranges into a separate document.",
  },
  rotate: {
    eyebrow: "ROTATE PAGES",
    title: "Rotate PDF pages.",
    description:
      "Correct page orientation before downloading your PDF.",
  },
  "page-numbers": {
    eyebrow: "PAGE NUMBERS",
    title: "Add page numbers.",
    description:
      "Add clean page numbering to your PDF.",
  },
  watermark: {
    eyebrow: "ADD WATERMARK",
    title: "Watermark your PDF.",
    description:
      "Add your own text watermark to PDF pages.",
  },
  "remove-watermark": {
    eyebrow: "REMOVE YOUR WATERMARK",
    title: "Remove a watermark you own.",
    description:
      "A dedicated tool for removing your own previously added watermark.",
  },
  sign: {
    eyebrow: "SIGN PDF",
    title: "Sign your PDF.",
    description:
      "Add your signature to a PDF document.",
  },
  "fill-forms": {
    eyebrow: "FILL FORMS",
    title: "Fill PDF forms.",
    description:
      "Enter information into fillable PDF form fields.",
  },
  "password-protect": {
    eyebrow: "PASSWORD PROTECT",
    title: "Protect your PDF.",
    description:
      "Add password protection to your PDF document.",
  },
  metadata: {
    eyebrow: "PDF METADATA",
    title: "Edit PDF metadata.",
    description:
      "Inspect and edit document metadata such as title, author and subject.",
  },
};

/* ------------------------------------------------------------
   Component
------------------------------------------------------------ */

export default function PDFWorkspace({ mode = "workspace" }) {
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const compressionResultRef = useRef(null);
  const successRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [processingOperation, setProcessingOperation] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const [splitMode, setSplitMode] = useState("pages");
  const [splitRanges, setSplitRanges] = useState("");
  const [splitSourceId, setSplitSourceId] = useState("");

  const [compressionPreset, setCompressionPreset] =
    useState("balanced");
  const [compressionBusy, setCompressionBusy] = useState(false);
  const [compressionProgress, setCompressionProgress] =
    useState("");
  const [compressionResult, setCompressionResult] =
    useState(null);

  const totalPages = useMemo(
    () => files.reduce((sum, item) => sum + (item.pages || 0), 0),
    [files]
  );

  const totalSize = useMemo(
    () => files.reduce((sum, item) => sum + (item.size || 0), 0),
    [files]
  );

  const selectedSplitSource = useMemo(
    () =>
      files.find((item) => item.id === splitSourceId) || null,
    [files, splitSourceId]
  );

  const isMerge = mode === "merge";
  const isSplit = mode === "split";
  const isCompress = mode === "compress";
  const isWorkspace = mode === "workspace";

  useEffect(() => {
    if (!success) return;

    const frame = requestAnimationFrame(() => {
      setTimeout(() => {
        successRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
    });

    return () => cancelAnimationFrame(frame);
  }, [success]);

  useEffect(() => {
    if (!compressionResult) return;

    const frame = requestAnimationFrame(() => {
      compressionResultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [compressionResult]);

  useEffect(() => {
    return () => {
      if (success?.url) {
        URL.revokeObjectURL(success.url);
      }

      if (success?.outputs) {
        success.outputs.forEach((output) => {
          if (output.url) {
            URL.revokeObjectURL(output.url);
          }
        });
      }
    };
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

        const loadingTask = pdfjsLib.getDocument({
          data: previewBytes,
        });

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
          (
            file.type === "application/pdf" ||
            /\.pdf$/i.test(file.name)
          )
      );

      if (!pdfFiles.length) {
        setError("Please select one or more PDF files.");
        return;
      }

      setError("");
      setSuccess(null);
      setCompressionResult(null);

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

          if (!splitSourceId) {
            setSplitSourceId(loaded[0]?.id || "");
          }
        }
      } finally {
        setProcessing(false);
        setProcessingOperation("");
      }
    },
    [readPDF, splitSourceId]
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
    setFiles((current) =>
      current.filter((item) => item.id !== id)
    );

    if (splitSourceId === id) {
      setSplitSourceId("");
    }

    setError("");
    setSuccess(null);
    setCompressionResult(null);
  };

  const clearFiles = () => {
    setFiles([]);
    setSplitSourceId("");
    setError("");
    setSuccess(null);

    setCompressionResult(null);
    setCompressionProgress("");
  };

  /* ------------------------------------------------------------
     Merge
  ------------------------------------------------------------ */

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Add at least two PDF files to merge them.");
      return;
    }

    setError("");
    setSuccess(null);
    setProcessing(true);
    setProcessingOperation("Preparing PDFs for merge");

    try {
      const mergedBytes = await mergePDF(
        files,
        (message) => setProcessingOperation(message)
      );

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
      console.error(
        "[FreePDF] PDF merge failed:",
        mergeError
      );

      setError(
        mergeError?.message ||
          "FreePDF couldn't merge these files."
      );
    } finally {
      setProcessing(false);
      setProcessingOperation("");
    }
  };

  /* ------------------------------------------------------------
     Split
  ------------------------------------------------------------ */

  const handleSplit = async () => {
    if (processing) return;

    const item =
      files.find((file) => file.id === splitSourceId) ||
      files[0] ||
      null;

    if (!item) {
      setError("Choose a PDF to split.");
      return;
    }

    if (!item.pages) {
      setError(
        "FreePDF couldn't determine the number of pages in this PDF."
      );
      return;
    }

    let groups = [];

    if (splitMode === "pages") {
      groups = Array.from(
        { length: item.pages },
        (_, index) => ({
          start: index + 1,
          end: index + 1,
          pages: [index + 1],
        })
      );
    } else {
      const parsed = parsePageRanges(
        splitRanges,
        item.pages
      );

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
      const outputFiles = await splitPDF(
        item.buffer,
        groups,
        (message) => setProcessingOperation(message)
      );

      const baseName = stripPdfExtension(item.name);

      const outputs = outputFiles.map((output) => {
        const blob = new Blob([output.bytes], {
          type: "application/pdf",
        });

        const url = URL.createObjectURL(blob);

        let filename;

        if (output.start === output.end) {
          filename =
            `${baseName}-Page-${String(
              output.start
            ).padStart(2, "0")}.pdf`;
        } else {
          filename =
            `${baseName}-Pages-${output.start}-${output.end}.pdf`;
        }

        return {
          id: makeId(),
          url,
          filename,
          size: output.bytes.byteLength,
          pages: output.pages,
        };
      });

      setSuccess({
        type: "split",
        sourceName: item.name,
        outputs,
      });
    } catch (splitError) {
      console.error(
        "[FreePDF] PDF split failed:",
        splitError
      );

      setError(
        splitError?.message ||
          "FreePDF couldn't split this PDF."
      );
    } finally {
      setProcessing(false);
      setProcessingOperation("");
    }
  };

  /* ------------------------------------------------------------
     Compress
  ------------------------------------------------------------ */

  const handleCompress = async () => {
    if (!files.length) {
      setError(
        "Please upload a PDF before compressing."
      );
      return;
    }

    if (compressionBusy) return;

    const selectedPDF = files[0];

    try {
      setError("");
      setCompressionBusy(true);
      setCompressionProgress("Preparing PDF…");
      setCompressionResult(null);

      const originalBytes = selectedPDF.buffer;

      const compressedBytes = await compressPDF(
        originalBytes,
        compressionPreset,
        (message) => {
          setCompressionProgress(message);
        }
      );

      const originalSize =
        originalBytes.byteLength;

      const compressedSize =
        compressedBytes.byteLength;

      const reduction =
        originalSize > 0
          ? Math.max(
              0,
              (
                (originalSize - compressedSize) /
                originalSize
              ) * 100
            )
          : 0;

      setCompressionResult({
        bytes: compressedBytes,
        originalSize,
        compressedSize,
        reduction,
        wasSmaller:
          compressedSize < originalSize,
        originalName: selectedPDF.name,
      });
    } catch (compressionError) {
      console.error(
        "[FreePDF] Compression failed:",
        compressionError
      );

      setError(
        compressionError?.message ||
          "PDF compression failed. Please try again."
      );
    } finally {
      setCompressionBusy(false);
      setCompressionProgress("");
    }
  };

  const downloadOutput = (output) => {
    if (!output?.url) return;

    const link = document.createElement("a");

    link.href = output.url;
    link.download =
      output.filename || "FreeToolz.pdf";

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadCompressed = () => {
    if (!compressionResult) return;

    const blob = new Blob(
      [compressionResult.bytes],
      {
        type: "application/pdf",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = compressionResult.originalName
      ? compressionResult.originalName.replace(
          /\.pdf$/i,
          ""
        ) + "-compressed.pdf"
      : "compressed.pdf";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const startAgain = () => {
    if (success?.url) {
      URL.revokeObjectURL(success.url);
    }

    if (success?.outputs) {
      success.outputs.forEach((output) => {
        if (output.url) {
          URL.revokeObjectURL(output.url);
        }
      });
    }

    setSuccess(null);
    setError("");
  };

  /* ------------------------------------------------------------
     Success
  ------------------------------------------------------------ */

  if (success?.type === "split") {
    return (
      <section
        ref={successRef}
        className="freepdf-success"
      >
        <div className="freepdf-success-orbit">
          <div className="freepdf-success-check">
            <CheckIcon />
          </div>
        </div>

        <span className="freepdf-eyebrow">
          SPLIT COMPLETE
        </span>

        <h2>
          <span>Your PDF has been split.</span>
        </h2>

        <p>
          {success.outputs?.length || 0} separate PDF{" "}
          {success.outputs?.length === 1
            ? "file is"
            : "files are"}{" "}
          ready to download.
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
              style={{
                marginTop: 0,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div className="freepdf-result-icon">
                <FileIcon />
              </div>

              <div className="freepdf-result-info">
                <strong title={output.filename}>
                  {output.filename}
                </strong>

                <span>
                  {output.pages}{" "}
                  {output.pages === 1
                    ? "page"
                    : "pages"}{" "}
                  · {formatBytes(output.size)}
                </span>
              </div>

              <button
                type="button"
                className="freepdf-download-button"
                onClick={() =>
                  downloadOutput(output)
                }
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
      <section
        ref={successRef}
        className="freepdf-success"
      >
        <div className="freepdf-success-orbit">
          <div className="freepdf-success-check">
            <CheckIcon />
          </div>
        </div>

        <span className="freepdf-eyebrow">
          MERGE COMPLETE
        </span>

        <h2>
          <span>Your PDFs are merged.</span>
        </h2>

        <p>
          Your new PDF is ready to download.
        </p>

        <div className="freepdf-result-card">
          <div className="freepdf-result-icon">
            <FileIcon />
          </div>

          <div className="freepdf-result-info">
            <strong title={success.filename}>
              {success.filename}
            </strong>

            <span>
              {formatNumber(success.pages)} pages ·{" "}
              {formatBytes(success.size)}
            </span>
          </div>

          <button
            type="button"
            className="freepdf-download-button"
            onClick={() =>
              downloadOutput(success)
            }
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

  /* ------------------------------------------------------------
     Coming-soon tool
  ------------------------------------------------------------ */

  if (
    !isWorkspace &&
    !isMerge &&
    !isSplit &&
    !isCompress
  ) {
    const info =
      TOOL_INFO[mode] || {
        eyebrow: "FREEPDF TOOL",
        title: "A useful PDF tool is on the way.",
        description:
          "This dedicated FreePDF tool page is being built next.",
      };

    return (
      <section className="freepdf-success">
        <div className="freepdf-success-orbit">
          <div className="freepdf-success-check">
            <FileIcon />
          </div>
        </div>

        <span className="freepdf-eyebrow">
          {info.eyebrow}
        </span>

        <h2>
          <span>{info.title}</span>
        </h2>

        <p>{info.description}</p>

        <div
          className="freepdf-result-card"
          style={{
            width: "min(650px, 100%)",
            marginTop: 28,
            boxSizing: "border-box",
          }}
        >
          <div className="freepdf-result-icon">
            <span
              style={{
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              ✦
            </span>
          </div>

          <div className="freepdf-result-info">
            <strong>Coming next</strong>
            <span>
              The page is reserved for this tool.
            </span>
          </div>
        </div>

        <button
          type="button"
          className="freepdf-start-again"
          onClick={() => navigate("/workspace")}
        >
          View all tools
        </button>
      </section>
    );
  }

  /* ------------------------------------------------------------
     Main workspace
  ------------------------------------------------------------ */

  const pageTitle = isMerge
    ? "Merge your PDFs"
    : isSplit
    ? "Split your PDF"
    : isCompress
    ? "Compress your PDF"
    : "PDF Workspace";

  const pageEyebrow = isMerge
    ? "MERGE PDF"
    : isSplit
    ? "SPLIT PDF"
    : isCompress
    ? "COMPRESS PDF"
    : "FREEPDF WORKSPACE";

  const pageDescription = isMerge
    ? "Combine multiple PDF files into one document."
    : isSplit
    ? "Separate a PDF into individual pages or custom ranges."
    : isCompress
    ? "Reduce your PDF file size directly in your browser."
    : "Choose a PDF operation and get the job done.";

  return (
    <section className="freepdf-workspace">
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
            <h3>
              {isCompress
                ? "Drop your PDF here"
                : isSplit
                ? "Drop the PDF you want to split"
                : isMerge
                ? "Drop the PDFs you want to merge"
                : "Drop your PDFs here"}
            </h3>

            <p>
              or choose files from your device
            </p>
          </div>

          <button
            type="button"
            className="freepdf-browse-button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={
              processing || compressionBusy
            }
          >
            Choose PDF files
            <span>↗</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple={!isCompress}
            hidden
            onChange={handleFileInput}
          />

          <div className="freepdf-upload-meta">
            <span>PDF files</span>
            <i />
            <span>
              Processed privately in your browser
            </span>
          </div>

          {(processing || compressionBusy) && (
            <div className="freepdf-loading">
              <span className="freepdf-spinner" />
              <span>
                {compressionProgress ||
                  processingOperation ||
                  "Processing..."}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="freepdf-error">
            <span>
              <AlertIcon />
            </span>

            <div>
              <strong>
                Something needs attention
              </strong>

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

        {files.length > 0 && (
          <>
            <div className="freepdf-workspace-header">
              <div>
                <span className="freepdf-eyebrow">
                  {pageEyebrow}
                </span>

                <h2>{pageTitle}</h2>

                <p>
                  {pageDescription}
                </p>
              </div>

              <button
                type="button"
                className="freepdf-clear-button"
                onClick={clearFiles}
                disabled={
                  processing ||
                  compressionBusy
                }
              >
                Clear all
              </button>
            </div>

            <div className="freepdf-stats">
              <div className="freepdf-stat">
                <span>PDFs</span>
                <strong>
                  {formatNumber(files.length)}
                </strong>
              </div>

              <div className="freepdf-stat-divider" />

              <div className="freepdf-stat">
                <span>Pages</span>
                <strong>
                  {formatNumber(totalPages)}
                </strong>
              </div>

              <div className="freepdf-stat-divider" />

              <div className="freepdf-stat">
                <span>Total size</span>
                <strong>
                  {formatBytes(totalSize)}
                </strong>
              </div>
            </div>

            <div className="freepdf-file-list">
              {files.map((item, index) => (
                <div
                  className="freepdf-file-card"
                  key={item.id}
                >
                  <span className="freepdf-file-number">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <div className="freepdf-file-icon">
                    <FileIcon />
                  </div>

                  <div className="freepdf-file-info">
                    <strong title={item.name}>
                      {item.name}
                    </strong>

                    <span>
                      {item.pages}{" "}
                      {item.pages === 1
                        ? "page"
                        : "pages"}{" "}
                      · {formatBytes(item.size)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="freepdf-remove-file"
                    onClick={() =>
                      removeFile(item.id)
                    }
                    disabled={
                      processing ||
                      compressionBusy
                    }
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
                  {totalPages === 1
                    ? "PAGE"
                    : "PAGES"}
                </span>
              </div>

              {files.map((item) => (
                <PreviewPages
                  item={item}
                  key={item.id}
                />
              ))}
            </div>

            {/* ------------------------------------------------
                WORKSPACE TOOL SELECTOR
            ------------------------------------------------ */}

            {isWorkspace && (
              <div className="freepdf-action-panel">
                <div>
                  <span className="freepdf-eyebrow">
                    PDF TOOLS
                  </span>

                  <h3>
                    What would you like to do?
                  </h3>

                  <p>
                    Choose a dedicated FreePDF
                    tool.
                  </p>
                </div>

                <div className="freepdf-action-grid">

                  <button
                    type="button"
                    className="freepdf-action-card freepdf-action-primary"
                    onClick={() =>
                      navigate("/merge")
                    }
                  >
                    <span>Merge</span>
                    <small>
                      Combine multiple PDFs
                      into one
                    </small>
                    <b>
                      <ChevronIcon />
                    </b>
                  </button>

                  <button
                    type="button"
                    className="freepdf-action-card freepdf-action-primary"
                    onClick={() =>
                      navigate("/split")
                    }
                  >
                    <span>Split</span>
                    <small>
                      Divide a PDF into
                      separate parts
                    </small>
                    <b>
                      <ChevronIcon />
                    </b>
                  </button>

                  <button
                    type="button"
                    className="freepdf-action-card freepdf-action-primary"
                    onClick={() =>
                      navigate("/compress")
                    }
                  >
                    <span>Compress</span>
                    <small>
                      Reduce PDF file size
                    </small>
                    <b>
                      <ChevronIcon />
                    </b>
                  </button>

                  <button
                    type="button"
                    className="freepdf-action-card"
                    onClick={() =>
                      navigate("/extract")
                    }
                  >
                    <span>Extract</span>
                    <small>
                      Extract selected pages
                    </small>
                    <b>
                      <ChevronIcon />
                    </b>
                  </button>

                  <button
                    type="button"
                    className="freepdf-action-card"
                    onClick={() =>
                      navigate("/rearrange")
                    }
                  >
                    <span>Rearrange</span>
                    <small>
                      Change page order
                    </small>
                    <b>
                      <ChevronIcon />
                    </b>
                  </button>

                  <button
                    type="button"
                    className="freepdf-action-card"
                    onClick={() =>
                      navigate("/delete-pages")
                    }
                  >
                    <span>Delete pages</span>
                    <small>
                      Remove unwanted pages
                    </small>
                    <b>
                      <ChevronIcon />
                    </b>
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------
                MERGE
            ------------------------------------------------ */}

            {isMerge && (
              <div className="freepdf-action-panel">
                <div>
                  <span className="freepdf-eyebrow">
                    MERGE PDF
                  </span>

                  <h3>
                    Combine your PDFs
                  </h3>

                  <p>
                    Your files will be merged
                    in the order shown above.
                  </p>
                </div>

                <div className="freepdf-result-card">
                  <div className="freepdf-result-icon">
                    <FileIcon />
                  </div>

                  <div className="freepdf-result-info">
                    <strong>
                      {files.length}{" "}
                      {files.length === 1
                        ? "PDF"
                        : "PDFs"}{" "}
                      selected
                    </strong>

                    <span>
                      {formatNumber(totalPages)}{" "}
                      total pages ·{" "}
                      {formatBytes(totalSize)}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "flex-end",
                    marginTop: 18,
                  }}
                >
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleMerge}
                    disabled={
                      processing ||
                      files.length < 2
                    }
                  >
                    {processing
                      ? "Merging..."
                      : "Merge PDFs"}
                    {!processing && (
                      <ChevronIcon />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------
                SPLIT
            ------------------------------------------------ */}

            {isSplit && (
              <div className="freepdf-action-panel">
                <div>
                  <span className="freepdf-eyebrow">
                    SPLIT PDF
                  </span>

                  <h3>
                    Divide your PDF
                  </h3>

                  <p>
                    Choose a document and
                    decide how its pages
                    should be separated.
                  </p>
                </div>

                <div className="freepdf-action-grid">

                  <button
                    type="button"
                    className={`freepdf-action-card ${
                      splitMode === "pages"
                        ? "freepdf-action-primary"
                        : ""
                    }`}
                    onClick={() =>
                      setSplitMode("pages")
                    }
                    disabled={processing}
                  >
                    <span>
                      Every page
                    </span>

                    <small>
                      One PDF for each
                      page
                    </small>

                    <b>
                      {splitMode ===
                      "pages"
                        ? "✓"
                        : <ChevronIcon />}
                    </b>
                  </button>

                  <button
                    type="button"
                    className={`freepdf-action-card ${
                      splitMode === "ranges"
                        ? "freepdf-action-primary"
                        : ""
                    }`}
                    onClick={() =>
                      setSplitMode("ranges")
                    }
                    disabled={processing}
                  >
                    <span>
                      Custom ranges
                    </span>

                    <small>
                      Choose sections
                      to create
                    </small>

                    <b>
                      {splitMode ===
                      "ranges"
                        ? "✓"
                        : <ChevronIcon />}
                    </b>
                  </button>
                </div>

                <div
                  className="freepdf-result-card"
                  style={{
                    marginTop: 12,
                    width: "100%",
                    boxSizing:
                      "border-box",
                  }}
                >
                  <div className="freepdf-result-icon">
                    <FileIcon />
                  </div>

                  <div className="freepdf-result-info">
                    <strong>
                      PDF to split
                    </strong>

                    <span>
                      {selectedSplitSource?.name ||
                        files[0]?.name ||
                        "Choose a document"}
                    </span>
                  </div>
                </div>

                <div
                  className="freepdf-action-grid"
                  style={{
                    marginTop: 11,
                  }}
                >
                  {files.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`freepdf-action-card ${
                        item.id ===
                        splitSourceId
                          ? "freepdf-action-primary"
                          : ""
                      }`}
                      onClick={() =>
                        setSplitSourceId(
                          item.id
                        )
                      }
                      disabled={processing}
                    >
                      <span>
                        {item.name}
                      </span>

                      <small>
                        {item.pages}{" "}
                        {item.pages === 1
                          ? "page"
                          : "pages"}{" "}
                        ·{" "}
                        {formatBytes(
                          item.size
                        )}
                      </small>

                      <b>
                        {item.id ===
                        splitSourceId
                          ? "✓"
                          : <ChevronIcon />}
                      </b>
                    </button>
                  ))}
                </div>

                {splitMode ===
                  "ranges" && (
                  <div
                    className="freepdf-result-card"
                    style={{
                      marginTop: 11,
                      width: "100%",
                      boxSizing:
                        "border-box",
                    }}
                  >
                    <div className="freepdf-result-icon">
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                        }}
                      >
                        #
                      </span>
                    </div>

                    <div className="freepdf-result-info">
                      <strong>
                        Page ranges
                      </strong>

                      <span>
                        Example:
                        1-3, 5-7, 10
                      </span>

                      <input
                        type="text"
                        value={splitRanges}
                        onChange={(event) =>
                          setSplitRanges(
                            event.target.value
                          )
                        }
                        placeholder="1-3, 5-7, 10"
                        disabled={
                          processing
                        }
                        aria-label="Page ranges"
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          marginTop: 9,
                          minHeight: 42,
                          padding:
                            "0 12px",
                          borderRadius: 12,
                          border:
                            "1px solid rgba(202,219,212,0.12)",
                          background:
                            "rgba(255,255,255,0.035)",
                          color:
                            "#edf6f2",
                          outline:
                            "none",
                          font:
                            "inherit",
                        }}
                      />
                    </div>
                  </div>
                )}

                {selectedSplitSource && (
                  <div
                    style={{
                      marginTop: 13,
                      color:
                        "rgba(200,218,210,0.48)",
                      fontSize: 10,
                      lineHeight: 1.5,
                    }}
                  >
                    {splitMode ===
                    "pages"
                      ? `This will create ${selectedSplitSource.pages} PDF ${
                          selectedSplitSource.pages ===
                          1
                            ? "file"
                            : "files"
                        }.`
                      : "Each comma-separated section becomes a separate PDF."}
                  </div>
                )}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "flex-end",
                    marginTop: 18,
                  }}
                >
                  <button
                    type="button"
                    className="primary-button"
                    onClick={
                      handleSplit
                    }
                    disabled={
                      processing ||
                      !selectedSplitSource
                    }
                  >
                    {processing
                      ? "Splitting..."
                      : "Split PDF"}
                    {!processing && (
                      <ChevronIcon />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------
                COMPRESS
            ------------------------------------------------ */}

            {isCompress && (
              <div className="freepdf-action-panel">
                <div>
                  <span className="freepdf-eyebrow">
                    COMPRESS PDF
                  </span>

                  <h3>
                    Reduce your PDF size
                  </h3>

                  <p>
                    Compress your PDF
                    directly in your browser.
                    Your document never leaves
                    your device.
                  </p>
                </div>

                <div className="freepdf-action-grid">

                  {[
                    [
                      "balanced",
                      "Balanced",
                      "Good quality with meaningful size reduction",
                    ],
                    [
                      "strong",
                      "Strong",
                      "Smaller files with more compression",
                    ],
                    [
                      "maximum",
                      "Maximum",
                      "Maximum size reduction",
                    ],
                  ].map(
                    ([
                      value,
                      title,
                      description,
                    ]) => (
                      <button
                        key={value}
                        type="button"
                        className={`freepdf-action-card ${
                          compressionPreset ===
                          value
                            ? "freepdf-action-primary"
                            : ""
                        }`}
                        onClick={() =>
                          setCompressionPreset(
                            value
                          )
                        }
                        disabled={
                          compressionBusy
                        }
                      >
                        <span>
                          {title}
                        </span>

                        <small>
                          {description}
                        </small>

                        <b>
                          {compressionPreset ===
                          value
                            ? "✓"
                            : <ChevronIcon />}
                        </b>
                      </button>
                    )
                  )}
                </div>

                <div
                  className="freepdf-result-card"
                  style={{
                    marginTop: 12,
                    width: "100%",
                    boxSizing:
                      "border-box",
                  }}
                >
                  <div className="freepdf-result-icon">
                    <FileIcon />
                  </div>

                  <div className="freepdf-result-info">
                    <strong>
                      PDF to compress
                    </strong>

                    <span>
                      {files[0]?.name ||
                        "Choose a document"}{" "}
                      ·{" "}
                      {files[0]
                        ? formatBytes(
                            files[0].size
                          )
                        : "0 B"}
                    </span>
                  </div>
                </div>

                {compressionProgress && (
                  <div
                    className="freepdf-result-card"
                    style={{
                      marginTop: 12,
                      width: "100%",
                      boxSizing:
                        "border-box",
                    }}
                  >
                    <div className="freepdf-result-icon">
                      <FileIcon />
                    </div>

                    <div className="freepdf-result-info">
                      <strong>
                        {
                          compressionProgress
                        }
                      </strong>

                      <span>
                        Keep this tab open
                        while FreePDF
                        works.
                      </span>
                    </div>
                  </div>
                )}

                {compressionResult && (
                  <div
                    ref={
                      compressionResultRef
                    }
                    className="freepdf-result-card"
                    style={{
                      marginTop: 12,
                      width: "100%",
                      boxSizing:
                        "border-box",
                    }}
                  >
                    <div className="freepdf-result-icon">
                      <CheckIcon />
                    </div>

                    <div className="freepdf-result-info">
                      <strong>
                        {compressionResult.wasSmaller
                          ? `${compressionResult.reduction.toFixed(
                              1
                            )}% smaller`
                          : "Already optimized"}
                      </strong>

                      <span>
                        {formatBytes(
                          compressionResult.originalSize
                        )}{" "}
                        →{" "}
                        {formatBytes(
                          compressionResult.compressedSize
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="freepdf-download-button"
                      onClick={
                        downloadCompressed
                      }
                    >
                      <DownloadIcon />
                      <span>
                        Download
                      </span>
                    </button>
                  </div>
                )}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "flex-end",
                    marginTop: 18,
                  }}
                >
                  <button
                    type="button"
                    className="primary-button"
                    onClick={
                      handleCompress
                    }
                    disabled={
                      compressionBusy ||
                      !files.length
                    }
                  >
                    {compressionBusy
                      ? "Compressing..."
                      : "Compress PDF"}

                    {!compressionBusy && (
                      <ChevronIcon />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!files.length &&
          !processing &&
          !compressionBusy && (
            <div
              className="freepdf-file-card"
              style={{
                marginTop: 24,
                justifyContent:
                  "center",
                flexDirection:
                  "column",
                textAlign:
                  "center",
                padding:
                  "28px",
              }}
            >
              <div className="freepdf-file-icon">
                <FileIcon />
              </div>

              <div className="freepdf-file-info">
                <strong>
                  {isWorkspace
                    ? "Your PDF workspace"
                    : `Ready for ${
                        pageTitle
                      }`}
                </strong>

                <span>
                  {isWorkspace
                    ? "Add one or more PDF files above to start working with them."
                    : "Add your PDF above to begin."}
                </span>
              </div>
            </div>
          )}

        {(processing ||
          compressionBusy) &&
          files.length > 0 && (
            <div className="freepdf-processing">
              <div className="freepdf-processing-ring">
                <span />
              </div>

              <div>
                <strong>
                  {compressionProgress ||
                    processingOperation ||
                    "Processing your PDF"}
                </strong>

                <p>
                  Everything is being
                  processed locally in
                  your browser.
                </p>
              </div>
            </div>
          )}
      </div>
    </section>
  );
}
