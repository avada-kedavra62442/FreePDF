import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PDFDocument } from "pdf-lib";

/*
  ============================================================
  FreePDF Workspace
  FreeToolz
  ============================================================

  Architecture:
  - pdf-lib = authoritative PDF engine
  - PDF.js = optional visual preview only
  - PDF.js is lazy-loaded for iOS/iPadOS compatibility
  - All processing happens locally in the browser
  - No API/server required
  - Merge and Split never depend on PDF.js
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

        pdfjsPromise = null;

        return null;
      });
  }

  return pdfjsPromise;
}

/* ------------------------------------------------------------
   Utility helpers
------------------------------------------------------------ */

function makeId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const value =
    bytes / Math.pow(1024, index);

  return `${value.toFixed(
    value >= 100 || index === 0 ? 0 : 1
  )} ${units[index]}`;
}

function formatNumber(number) {
  return Number(number || 0).toLocaleString();
}

function stripPdfExtension(filename) {
  return filename
    .replace(/\.pdf$/i, "")
    .trim() || "Document";
}

/* ------------------------------------------------------------
   SVG icons
------------------------------------------------------------ */

function UploadIcon() {
  return (
    <svg
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

function ScissorsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="m8.5 7.5 11-6" />
      <path d="m8.5 16.5 11 6" />
      <path d="m8.5 7.5 11 11" />
      <path d="m8.5 16.5 11-11" />
    </svg>
  );
}

function MergeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
      <path d="M11 7h3a2 2 0 0 1 2 2v4" />
      <path d="m13 11 3 3 3-3" />
    </svg>
  );
}

/* ------------------------------------------------------------
   PDF range parser

   Supported:
     1
     1-3
     1 - 3
     1-3,5-6
     1-3 , 5-6
     1,3,5
     1-3,5,7-9

   Rejected:
     1-3-5
     5-4
     1--3
     -1
     1-
     -3
     1-3,,5
     1,3,1
     1-3,1-4
     out-of-range pages
     duplicate pages
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

  /*
    A comma separates output sections.

    We deliberately reject empty sections such as:
      1-3,
      ,1-3
      1-3,,5
  */
  const rawParts = raw.split(",");

  if (
    rawParts.some(
      (part) => !part.trim()
    )
  ) {
    return {
      pages: null,
      groups: null,
      error:
        "There is an empty section in your input. Separate sections with commas, for example 1-3, 5-6.",
    };
  }

  const groups = [];
  const allPages = [];
  const seen = new Set();

  for (const rawPart of rawParts) {
    const part = rawPart.trim();

    /*
      A valid section is either:
        7
        1-7
        1 - 7

      This deliberately rejects:
        1-3-5
        1--3
        1 - - 3
        abc
    */
    if (/^\d+$/.test(part)) {
      const page = Number(part);

      if (!Number.isSafeInteger(page)) {
        return {
          pages: null,
          groups: null,
          error: `Page "${part}" is too large to process safely.`,
        };
      }

      if (page < 1) {
        return {
          pages: null,
          groups: null,
          error:
            "Page numbers start at 1. Page 0 does not exist.",
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

      const group = [page];

      groups.push({
        start: page,
        end: page,
        pages: group,
      });

      allPages.push(page);

      continue;
    }

    /*
      Range:
        1-3
        1 - 3
        1   -   3
    */
    const rangeMatch =
      part.match(/^(\d+)\s*-\s*(\d+)$/);

    if (!rangeMatch) {
      return {
        pages: null,
        groups: null,
        error: `"${part}" isn't a valid section. Use formats such as 3, 2-6, or 1-3, 5-7.`,
      };
    }

    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);

    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end)
    ) {
      return {
        pages: null,
        groups: null,
        error: `Range "${part}" contains a number that is too large to process safely.`,
      };
    }

    if (start < 1 || end < 1) {
      return {
        pages: null,
        groups: null,
        error:
          `Range "${part}" contains an invalid page number. Page numbers start at 1.`,
      };
    }

    if (start > totalPages) {
      return {
        pages: null,
        groups: null,
        error: `Range "${part}" starts at page ${start}, but this PDF only has ${totalPages} ${
          totalPages === 1 ? "page" : "pages"
        }.`,
      };
    }

    if (end > totalPages) {
      return {
        pages: null,
        groups: null,
        error: `Range "${part}" ends at page ${end}, but this PDF only has ${totalPages} ${
          totalPages === 1 ? "page" : "pages"
        }.`,
      };
    }

    if (start > end) {
      return {
        pages: null,
        groups: null,
        error: `Range "${part}" is backwards. Use ${end}-${start} if that is what you intended.`,
      };
    }

    const groupPages = [];

    for (
      let page = start;
      page <= end;
      page += 1
    ) {
      if (seen.has(page)) {
        return {
          pages: null,
          groups: null,
          error: `Page ${page} is included more than once because your sections overlap or duplicate an earlier page.`,
        };
      }

      seen.add(page);
      groupPages.push(page);
      allPages.push(page);
    }

    groups.push({
      start,
      end,
      pages: groupPages,
    });
  }

  return {
    pages: allPages,
    groups,
    error: "",
  };
}

/* ------------------------------------------------------------
   Component
------------------------------------------------------------ */

export default function PDFWorkspace() {
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  const [
    processingOperation,
    setProcessingOperation,
  ] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState(null);

  /* Split state */
  const [splitOpen, setSplitOpen] =
    useState(false);

  const [splitSourceId, setSplitSourceId] =
    useState("");

  const [splitMode, setSplitMode] =
    useState("pages");

  const [splitRanges, setSplitRanges] =
    useState("");

  /* ----------------------------------------------------------
     Derived stats
  ---------------------------------------------------------- */

  const totalPages = useMemo(
    () =>
      files.reduce(
        (total, item) =>
          total + (item.pages || 0),
        0
      ),
    [files]
  );

  const totalSize = useMemo(
    () =>
      files.reduce(
        (total, item) =>
          total + (item.size || 0),
        0
      ),
    [files]
  );

  const selectedSplitSource = useMemo(
    () =>
      files.find(
        (item) =>
          item.id === splitSourceId
      ) || null,
    [files, splitSourceId]
  );

  /* ----------------------------------------------------------
     Cleanup generated URLs
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     Read PDF

     pdf-lib is authoritative.

     PDF.js is ONLY used for previews and is lazy-loaded
     so failure to load PDF.js can never prevent the PDF
     workspace itself from functioning.
  ---------------------------------------------------------- */

  const readPDF = useCallback(
    async (file) => {
      const buffer =
        await file.arrayBuffer();

      const pdfDocument =
        await PDFDocument.load(buffer);

      const pages =
        pdfDocument.getPageCount();

      /*
        Independent byte copy for actual PDF operations.
        This is important because PDF.js may otherwise
        consume/detach the same underlying data.
      */
      const operationBytes =
        new Uint8Array(
          buffer.slice(0)
        );

      let previewPdf = null;

      try {
        const pdfjsLib =
          await loadPDFJS();

        if (pdfjsLib) {
          const previewBytes =
            new Uint8Array(
              buffer.slice(0)
            );

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
    },
    []
  );

  /* ----------------------------------------------------------
     Add files
  ---------------------------------------------------------- */

  const addFiles = useCallback(
    async (incomingFiles) => {
      const pdfFiles =
        Array.from(incomingFiles || {}).filter(
          (file) =>
            file &&
            (
              file.type ===
                "application/pdf" ||
              /\.pdf$/i.test(file.name)
            )
        );

      if (!pdfFiles.length) {
        setError(
          "Please select one or more PDF files."
        );
        return;
      }

      setError("");
      setSuccess(null);
      setProcessing(true);
      setProcessingOperation(
        "Reading your PDFs"
      );

      try {
        const loaded = [];

        for (const file of pdfFiles) {
          try {
            const item =
              await readPDF(file);

            loaded.push(item);
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
          setFiles((current) => [
            ...current,
            ...loaded,
          ]);
        }
      } finally {
        setProcessing(false);
        setProcessingOperation("");
      }
    },
    [readPDF]
  );

  /* ----------------------------------------------------------
     File input
  ---------------------------------------------------------- */

  const handleFileInput = async (
    event
  ) => {
    const selected =
      event.target.files;

    await addFiles(selected);

    /*
      Allows selecting the same file again
      after removing it.
    */
    event.target.value = "";
  };

  /* ----------------------------------------------------------
     Drag/drop
  ---------------------------------------------------------- */

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

    /*
      Don't deactivate when moving between
      children inside the drop zone.
    */
    if (
      dropZoneRef.current &&
      !dropZoneRef.current.contains(
        event.relatedTarget
      )
    ) {
      setDragActive(false);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    await addFiles(
      event.dataTransfer.files
    );
  };

  /* ----------------------------------------------------------
     Remove file
  ---------------------------------------------------------- */

  const removeFile = (id) => {
    setFiles((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );

    if (splitSourceId === id) {
      setSplitSourceId("");
    }

    setError("");
    setSuccess(null);
  };

  /* ----------------------------------------------------------
     Clear all
  ---------------------------------------------------------- */

  const clearFiles = () => {
    setFiles([]);
    setSplitSourceId("");
    setError("");
    setSuccess(null);
  };

  /* ----------------------------------------------------------
     Open Split
  ---------------------------------------------------------- */

  const openSplit = () => {
    if (!files.length) {
      setError(
        "Add a PDF before splitting it."
      );
      return;
    }

    setError("");
    setSuccess(null);

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

  /* ----------------------------------------------------------
     Close Split
  ---------------------------------------------------------- */

  const closeSplit = () => {
    if (processing) {
      return;
    }

    setSplitOpen(false);
    setSplitRanges("");
    setError("");
  };

  /* ----------------------------------------------------------
     Split PDF
  ---------------------------------------------------------- */

  const splitPDF = async () => {
    if (processing) {
      return;
    }

    const item =
      files.find(
        (file) =>
          file.id === splitSourceId
      ) || null;

    if (!item) {
      setError(
        "Choose a PDF to split."
      );
      return;
    }

    if (!item.pages) {
      setError(
        "FreePDF couldn't determine the number of pages in this PDF."
      );
      return;
    }

    /*
      --------------------------------------------------------
      Build output groups
      --------------------------------------------------------
    */

    let groups = [];

    if (splitMode === "pages") {
      /*
        Every page becomes its own PDF.
      */
      groups = Array.from(
        {
          length: item.pages,
        },
        (_, index) => ({
          start: index + 1,
          end: index + 1,
          pages: [index + 1],
        })
      );
    } else {
      /*
        Custom ranges.

        Validate EVERYTHING before touching the PDF.
        This prevents half-completed output if the user
        enters malformed input.
      */
      const parsed =
        parsePageRanges(
          splitRanges,
          item.pages
        );

      if (parsed.error) {
        setError(parsed.error);
        return;
      }

      groups = parsed.groups;
    }

    if (!groups?.length) {
      setError(
        "Choose at least one section to split."
      );
      return;
    }

    setError("");
    setSuccess(null);

    setProcessing(true);
    setProcessingOperation(
      "Splitting your PDF"
    );

    try {
      /*
        Always use a fresh independent copy.
      */
      const sourceBytes =
        new Uint8Array(
          item.buffer.slice(0)
        );

      const sourcePdf =
        await PDFDocument.load(
          sourceBytes
        );

      const baseName =
        stripPdfExtension(
          item.name
        );

      const outputs = [];

      /*
        One PDF per group.

        Example:
          1-3, 5-6

        produces:
          Document-Pages-1-3.pdf
          Document-Pages-5-6.pdf
      */
      for (
        let index = 0;
        index < groups.length;
        index += 1
      ) {
        const group = groups[index];

        const outputPdf =
          await PDFDocument.create();

        const sourceIndexes =
          group.pages.map(
            (pageNumber) =>
              pageNumber - 1
          );

        const copiedPages =
          await outputPdf.copyPages(
            sourcePdf,
            sourceIndexes
          );

        copiedPages.forEach(
          (page) => {
            outputPdf.addPage(page);
          }
        );

        const outputBytes =
          await outputPdf.save();

        let suffix = "";

        if (
          group.start ===
            group.end
        ) {
          suffix = `Page-${String(
            group.start
          ).padStart(2, "0")}`;
        } else {
          suffix = `Pages-${group.start}-${group.end}`;
        }

        const filename =
          `${baseName}-${suffix}.pdf`;

        const blob = new Blob(
          [outputBytes],
          {
            type: "application/pdf",
          }
        );

        const url =
          URL.createObjectURL(blob);

        outputs.push({
          id: makeId(),
          url,
          filename,
          size:
            outputBytes.byteLength,
          pages:
            group.pages.length,
          start:
            group.start,
          end:
            group.end,
        });
      }

      /*
        Close the modal only after successful
        processing.
      */
      setSplitOpen(false);

      setSuccess({
        type: "split",
        sourceName: item.name,
        outputs,
        size: outputs.reduce(
          (total, output) =>
            total + output.size,
          0
        ),
        pages: item.pages,
      });
    } catch (splitError) {
      console.error(
        "[FreePDF] PDF split failed:",
        splitError
      );

      setError(
        "FreePDF couldn't split this PDF. The file may be encrypted, damaged, or unsupported by pdf-lib."
      );
    } finally {
      setProcessing(false);
      setProcessingOperation("");
    }
  };

  /* ----------------------------------------------------------
     Merge PDF

     DO NOT CHANGE THIS LOGIC.

     This is the known-good implementation that
     works with the current FreePDF architecture.
  ---------------------------------------------------------- */

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
    setProcessingOperation(
      "Merging your PDFs"
    );

    try {
      const mergedPdf =
        await PDFDocument.create();

      for (const item of files) {
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

        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const mergedBytes =
        await mergedPdf.save();

      const blob = new Blob(
        [mergedBytes],
        {
          type: "application/pdf",
        }
      );

      const url =
        URL.createObjectURL(blob);

      setSuccess({
        type: "merge",
        url,
        filename:
          "FreeToolz-Merged.pdf",
        size:
          mergedBytes.byteLength,
        pages: totalPages,
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
      setProcessingOperation("");
    }
  };

  /* ----------------------------------------------------------
     Download helper
  ---------------------------------------------------------- */

  const downloadOutput = (
    output
  ) => {
    if (!output?.url) {
      return;
    }

    const link =
      document.createElement("a");

    link.href = output.url;
    link.download =
      output.filename ||
      "FreeToolz-Output.pdf";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  /* ----------------------------------------------------------
     Start again
  ---------------------------------------------------------- */

  const startAgain = () => {
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
  };

  /* ----------------------------------------------------------
     Preview page component
  ---------------------------------------------------------- */

  const PreviewPages = ({
    item,
  }) => {
    const [
      thumbnails,
      setThumbnails,
    ] = useState([]);

    useEffect(() => {
      let cancelled = false;

      async function renderPreview() {
        if (
          !item.previewAvailable ||
          !item.pdf
        ) {
          return;
        }

        try {
          const pdf =
            item.pdf;

          const maxPages =
            Math.min(
              pdf.numPages,
              6
            );

          const rendered = [];

          for (
            let pageNumber = 1;
            pageNumber <= maxPages;
            pageNumber += 1
          ) {
            if (cancelled) {
              return;
            }

            const page =
              await pdf.getPage(
                pageNumber
              );

            const baseViewport =
              page.getViewport({
                scale: 1,
              });

            const targetWidth =
              150;

            const scale =
              targetWidth /
              baseViewport.width;

            const viewport =
              page.getViewport({
                scale,
              });

            const canvas =
              document.createElement(
                "canvas"
              );

            const context =
              canvas.getContext(
                "2d"
              );

            if (!context) {
              continue;
            }

            canvas.width =
              Math.ceil(
                viewport.width
              );

            canvas.height =
              Math.ceil(
                viewport.height
              );

            await page.render({
              canvasContext:
                context,
              viewport,
            }).promise;

            rendered.push({
              pageNumber,
              dataUrl:
                canvas.toDataURL(
                  "image/jpeg",
                  0.82
                ),
            });
          }

          if (!cancelled) {
            setThumbnails(
              rendered
            );
          }
        } catch (previewError) {
          console.warn(
            "[FreePDF] Thumbnail rendering failed:",
            previewError
          );

          if (!cancelled) {
            setThumbnails([]);
          }
        }
      }

      renderPreview();

      return () => {
        cancelled = true;
      };
    }, [item]);

    if (
      !item.previewAvailable ||
      !item.pdf
    ) {
      return (
        <div className="freepdf-preview-fallback">
          <div className="freepdf-preview-fallback-icon">
            <FileIcon />
          </div>
          <span>PDF</span>
        </div>
      );
    }

    if (!thumbnails.length) {
      return (
        <div className="freepdf-preview-fallback">
          <div className="freepdf-preview-fallback-icon">
            <FileIcon />
          </div>
          <span>PDF</span>
        </div>
      );
    }

    return (
      <div className="freepdf-preview-grid">
        {thumbnails.map(
          (thumbnail) => (
            <div
              className="freepdf-preview-page"
              key={
                thumbnail.pageNumber
              }
            >
              <img
                src={
                  thumbnail.dataUrl
                }
                alt={`Page ${thumbnail.pageNumber}`}
              />

              <span>
                {thumbnail.pageNumber}
              </span>
            </div>
          )
        )}

        {item.pages > 6 && (
          <div className="freepdf-preview-more">
            +{item.pages - 6} more
          </div>
        )}
      </div>
    );
  };

  /* ----------------------------------------------------------
     Success screen
  ---------------------------------------------------------- */

  if (success) {
    if (
      success.type === "split"
    ) {
      return (
        <section className="freepdf-workspace freepdf-success-state">
          <div className="freepdf-success-card">
            <div className="freepdf-success-icon">
              <CheckIcon />
            </div>

            <div className="freepdf-success-heading">
              <span className="freepdf-eyebrow">
                SPLIT COMPLETE
              </span>

              <h2>
                Your PDF has been
                split.
              </h2>

              <p>
                {success.outputs?.length ||
                  0}{" "}
                separate PDF{" "}
                {success.outputs
                    ?.length === 1
                  ? "file is"
                  : "files are"}{" "}
                ready to download.
              </p>
            </div>

            <div className="freepdf-output-list">
              {success.outputs?.map(
                (output) => (
                  <div
                    className="freepdf-output-item"
                    key={output.id}
                  >
                    <div className="freepdf-output-icon">
                      <FileIcon />
                    </div>

                    <div className="freepdf-output-info">
                      <strong>
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
                        downloadOutput(
                          output
                        )
                      }
                    >
                      <DownloadIcon />
                      <span>
                        Download
                      </span>
                    </button>
                  </div>
                )
              )}
            </div>

            <div className="freepdf-success-actions">
              <button
                type="button"
                className="freepdf-primary-button"
                onClick={
                  startAgain
                }
              >
                Split another PDF
              </button>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="freepdf-workspace freepdf-success-state">
        <div className="freepdf-success-card">
          <div className="freepdf-success-icon">
            <CheckIcon />
          </div>

          <div className="freepdf-success-heading">
            <span className="freepdf-eyebrow">
              MERGE COMPLETE
            </span>

            <h2>
              Your PDFs are
              merged.
            </h2>

            <p>
              Your new PDF is
              ready to download.
            </p>
          </div>

          <div className="freepdf-success-summary">
            <div>
              <span>Pages</span>
              <strong>
                {formatNumber(
                  success.pages
                )}
              </strong>
            </div>

            <div>
              <span>File size</span>
              <strong>
                {formatBytes(
                  success.size
                )}
              </strong>
            </div>
          </div>

          <div className="freepdf-success-actions">
            <button
              type="button"
              className="freepdf-primary-button"
              onClick={() =>
                downloadOutput(
                  success
                )
              }
            >
              <DownloadIcon />
              Download PDF
            </button>

            <button
              type="button"
              className="freepdf-secondary-button"
              onClick={
                startAgain
              }
            >
              Start again
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ----------------------------------------------------------
     Main workspace
  ---------------------------------------------------------- */

  return (
    <section className="freepdf-workspace">
      {/* ======================================================
          Upload area
      ====================================================== */}

      <div
        ref={dropZoneRef}
        className={`freepdf-upload-zone ${
          dragActive
            ? "freepdf-upload-zone-active"
            : ""
        }`}
        onDragEnter={
          handleDragEnter
        }
        onDragOver={
          handleDragOver
        }
        onDragLeave={
          handleDragLeave
        }
        onDrop={handleDrop}
      >
        <div className="freepdf-upload-glow" />

        <div className="freepdf-upload-icon">
          <UploadIcon />
        </div>

        <div className="freepdf-upload-copy">
          <h3>
            Drop your PDFs here
          </h3>

          <p>
            or choose files from
            your device
          </p>
        </div>

        <button
          type="button"
          className="freepdf-primary-button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={processing}
        >
          Choose PDF files
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={
            handleFileInput
          }
        />

        <span className="freepdf-upload-hint">
          PDF files · Processed
          privately in your
          browser
        </span>
      </div>

      {/* ======================================================
          Error
      ====================================================== */}

      {error && (
        <div className="freepdf-error">
          <div className="freepdf-error-icon">
            <AlertIcon />
          </div>

          <div>
            <strong>
              Something needs
              attention
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Dismiss error"
          >
            <XIcon />
          </button>
        </div>
      )}

      {/* ======================================================
          File workspace
      ====================================================== */}

      {files.length > 0 && (
        <>
          <div className="freepdf-workspace-header">
            <div>
              <span className="freepdf-eyebrow">
                YOUR DOCUMENTS
              </span>

              <h2>
                PDF Workspace
              </h2>

              <p>
                Your files stay in
                your browser.
              </p>
            </div>

            <button
              type="button"
              className="freepdf-clear-button"
              onClick={
                clearFiles
              }
              disabled={processing}
            >
              Clear all
            </button>
          </div>

          {/* --------------------------------------------------
              Stats
          -------------------------------------------------- */}

          <div className="freepdf-stats">
            <div className="freepdf-stat">
              <span>PDFs</span>
              <strong>
                {formatNumber(
                  files.length
                )}
              </strong>
            </div>

            <div className="freepdf-stat">
              <span>Pages</span>
              <strong>
                {formatNumber(
                  totalPages
                )}
              </strong>
            </div>

            <div className="freepdf-stat">
              <span>Total size</span>
              <strong>
                {formatBytes(
                  totalSize
                )}
              </strong>
            </div>
          </div>

          {/* --------------------------------------------------
              File list
          -------------------------------------------------- */}

          <div className="freepdf-file-list">
            {files.map((item) => (
              <div
                className="freepdf-file-card"
                key={item.id}
              >
                <div className="freepdf-file-preview">
                  <PreviewPages
                    item={item}
                  />
                </div>

                <div className="freepdf-file-info">
                  <div className="freepdf-file-icon">
                    <FileIcon />
                  </div>

                  <div>
                    <strong
                      title={item.name}
                    >
                      {item.name}
                    </strong>

                    <span>
                      {item.pages}{" "}
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
                </div>

                <button
                  type="button"
                  className="freepdf-file-remove"
                  onClick={() =>
                    removeFile(
                      item.id
                    )
                  }
                  disabled={
                    processing
                  }
                  aria-label={`Remove ${item.name}`}
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>

          {/* ==================================================
              PDF actions
          ================================================== */}

          <div className="freepdf-actions-heading">
            <div>
              <span className="freepdf-eyebrow">
                PDF TOOLS
              </span>

              <h3>
                What would you
                like to do?
              </h3>
            </div>
          </div>

          <div className="freepdf-action-grid">
            {/* ------------------------------------------------
                MERGE
            ------------------------------------------------ */}

            <button
              type="button"
              className="freepdf-action-card freepdf-action-card-primary"
              onClick={
                mergePDFs
              }
              disabled={
                files.length < 2 ||
                processing
              }
            >
              <div className="freepdf-action-icon">
                <MergeIcon />
              </div>

              <div className="freepdf-action-content">
                <span>
                  Merge
                </span>

                <small>
                  Combine multiple
                  PDFs into one
                </small>
              </div>

              <b>
                <ChevronIcon />
              </b>
            </button>

            {/* ------------------------------------------------
                SPLIT

                IMPORTANT:
                This is intentionally NOT disabled after upload.

                The visual class is explicitly the active/
                primary action-card class so it does not inherit
                the disabled appearance of Extract/Compress.
            ------------------------------------------------ */}

            <button
              type="button"
              className="freepdf-action-card freepdf-action-card-primary freepdf-action-card-split"
              onClick={
                openSplit
              }
              disabled={
                files.length === 0 ||
                processing
              }
            >
              <div className="freepdf-action-icon">
                <ScissorsIcon />
              </div>

              <div className="freepdf-action-content">
                <span>
                  Split
                </span>

                <small>
                  Divide a PDF into
                  separate parts
                </small>
              </div>

              <b>
                <ChevronIcon />
              </b>
            </button>

            {/* ------------------------------------------------
                EXTRACT
            ------------------------------------------------ */}

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

            {/* ------------------------------------------------
                COMPRESS
            ------------------------------------------------ */}

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
        </>
      )}

      {/* ======================================================
          Empty state
      ====================================================== */}

      {!files.length && !processing && (
        <div className="freepdf-empty-state">
          <div className="freepdf-empty-icon">
            <FileIcon />
          </div>

          <h3>
            Your PDF workspace
          </h3>

          <p>
            Add one or more PDF
            files above to start
            working with them.
          </p>
        </div>
      )}

      {/* ======================================================
          Processing overlay
      ====================================================== */}

      {processing && (
        <div className="freepdf-processing">
          <div className="freepdf-processing-card">
            <div className="freepdf-processing-spinner" />

            <strong>
              {processingOperation ||
                "Processing your PDF"}
            </strong>

            <span>
              Everything is being
              processed locally in
              your browser.
            </span>
          </div>
        </div>
      )}

      {/* ======================================================
          SPLIT MODAL
      ====================================================== */}

      {splitOpen && (
        <div
          className="freepdf-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeSplit();
            }
          }}
        >
          <div
            className="freepdf-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="freepdf-split-title"
          >
            <div className="freepdf-modal-header">
              <div>
                <span className="freepdf-eyebrow">
                  SPLIT PDF
                </span>

                <h2 id="freepdf-split-title">
                  Divide your PDF
                </h2>

                <p>
                  Choose a document
                  and decide how its
                  pages should be
                  separated.
                </p>
              </div>

              <button
                type="button"
                className="freepdf-modal-close"
                onClick={
                  closeSplit
                }
                disabled={
                  processing
                }
                aria-label="Close split dialog"
              >
                <XIcon />
              </button>
            </div>

            <div className="freepdf-modal-body">
              {/* ----------------------------------------------
                  Source PDF
              ---------------------------------------------- */}

              <div className="freepdf-form-field">
                <label htmlFor="freepdf-split-source">
                  PDF to split
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
                      event.target
                        .value
                    )
                  }
                  disabled={
                    processing
                  }
                >
                  {files.map(
                    (item) => (
                      <option
                        key={
                          item.id
                        }
                        value={
                          item.id
                        }
                      >
                        {item.name}{" "}
                        —{" "}
                        {item.pages}{" "}
                        {item.pages ===
                        1
                          ? "page"
                          : "pages"}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* ----------------------------------------------
                  Split mode
              ---------------------------------------------- */}

              <div className="freepdf-form-field">
                <label>
                  Split method
                </label>

                <div className="freepdf-split-mode-grid">
                  <button
                    type="button"
                    className={`freepdf-split-mode ${
                      splitMode ===
                      "pages"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSplitMode(
                        "pages"
                      )
                    }
                    disabled={
                      processing
                    }
                  >
                    <span>
                      Every page
                    </span>

                    <small>
                      Create one PDF
                      for each page
                    </small>
                  </button>

                  <button
                    type="button"
                    className={`freepdf-split-mode ${
                      splitMode ===
                      "ranges"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSplitMode(
                        "ranges"
                      )
                    }
                    disabled={
                      processing
                    }
                  >
                    <span>
                      Custom ranges
                    </span>

                    <small>
                      Choose exactly
                      which sections
                      to create
                    </small>
                  </button>
                </div>
              </div>

              {/* ----------------------------------------------
                  Custom range input
              ---------------------------------------------- */}

              {splitMode ===
                "ranges" && (
                <div className="freepdf-form-field">
                  <label htmlFor="freepdf-split-ranges">
                    Page sections
                  </label>

                  <input
                    id="freepdf-split-ranges"
                    type="text"
                    value={
                      splitRanges
                    }
                    onChange={(
                      event
                    ) => {
                      setSplitRanges(
                        event.target
                          .value
                      );

                      /*
                        Clear an old validation
                        error while the user is
                        correcting the input.
                      */
                      if (error) {
                        setError(
                          ""
                        );
                      }
                    }}
                    placeholder="1-3, 5-6, 8-10"
                    autoComplete="off"
                    spellCheck="false"
                    disabled={
                      processing
                    }
                  />

                  <div className="freepdf-field-help">
                    <strong>
                      Example:
                    </strong>{" "}
                    <code>
                      1-3, 5-6
                    </code>

                    <span>
                      Each comma-separated
                      section becomes a
                      separate PDF.
                    </span>
                  </div>

                  <div className="freepdf-range-rules">
                    <div>
                      <CheckIcon />
                      <span>
                        <code>
                          1-3
                        </code>{" "}
                        is valid
                      </span>
                    </div>

                    <div>
                      <CheckIcon />
                      <span>
                        <code>
                          1 - 3
                        </code>{" "}
                        is valid
                      </span>
                    </div>

                    <div>
                      <CheckIcon />
                      <span>
                        <code>
                          1-3, 5-6
                        </code>{" "}
                        is valid
                      </span>
                    </div>

                    <div>
                      <AlertIcon />
                      <span>
                        <code>
                          1-3-5
                        </code>{" "}
                        is invalid
                      </span>
                    </div>

                    <div>
                      <AlertIcon />
                      <span>
                        <code>
                          5-4
                        </code>{" "}
                        is invalid
                      </span>
                    </div>

                    <div>
                      <AlertIcon />
                      <span>
                        Overlapping
                        pages are
                        rejected
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------
                  Preview of requested operation
              ---------------------------------------------- */}

              {selectedSplitSource && (
                <div className="freepdf-split-summary">
                  <div className="freepdf-split-summary-icon">
                    <ScissorsIcon />
                  </div>

                  <div>
                    <strong>
                      {
                        selectedSplitSource.name
                      }
                    </strong>

                    <span>
                      {
                        selectedSplitSource.pages
                      }{" "}
                      {selectedSplitSource.pages ===
                      1
                        ? "page"
                        : "pages"}{" "}
                      available
                    </span>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------
                  Modal error
              ---------------------------------------------- */}

              {error && (
                <div className="freepdf-modal-error">
                  <AlertIcon />
                  <span>
                    {error}
                  </span>
                </div>
              )}
            </div>

            {/* ----------------------------------------------
                Modal footer
            ---------------------------------------------- */}

            <div className="freepdf-modal-footer">
              <button
                type="button"
                className="freepdf-secondary-button"
                onClick={
                  closeSplit
                }
                disabled={
                  processing
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="freepdf-primary-button freepdf-split-submit"
                onClick={
                  splitPDF
                }
                disabled={
                  processing ||
                  !selectedSplitSource
                }
              >
                {processing ? (
                  <>
                    <span className="freepdf-button-spinner" />
                    Splitting…
                  </>
                ) : (
                  <>
                    <ScissorsIcon />
                    Split PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
