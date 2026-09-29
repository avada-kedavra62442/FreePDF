import React, { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/* =========================================================
   HELPERS
========================================================= */

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], {
    type: "application/pdf",
  });

  downloadBlob(blob, filename);
}

function parsePageList(value, totalPages) {
  const pages = new Set();

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const [rawStart, rawEnd] = part.split("-").map((v) => v.trim());

      const start = Number(rawStart);
      const end = Number(rawEnd);

      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end < 1
      ) {
        continue;
      }

      const from = Math.min(start, end);
      const to = Math.max(start, end);

      for (let page = from; page <= to; page++) {
        if (page <= totalPages) {
          pages.add(page - 1);
        }
      }
    } else {
      const page = Number(part);

      if (
        Number.isInteger(page) &&
        page >= 1 &&
        page <= totalPages
      ) {
        pages.add(page - 1);
      }
    }
  }

  return [...pages].sort((a, b) => a - b);
}

function arrayBufferCopy(buffer) {
  return new Uint8Array(buffer.slice(0));
}

/* =========================================================
   PDF READER
========================================================= */

async function readPDF(file) {
  const originalBuffer = await file.arrayBuffer();

  /*
   * IMPORTANT:
   * PDF.js may transfer/detach the ArrayBuffer passed to its worker.
   * Therefore PDF.js gets one copy and pdf-lib gets another.
   */
  const previewData = new Uint8Array(originalBuffer.slice(0));

  const loadingTask = pdfjsLib.getDocument({
    data: previewData,
  });

  const pdf = await loadingTask.promise;

  const mergeBytes = arrayBufferCopy(originalBuffer);

  return {
    id: makeId(),
    file,
    buffer: mergeBytes,
    name: file.name,
    size: file.size,
    pages: pdf.numPages,
    pdf,
  };
}

/* =========================================================
   PAGE THUMBNAIL
========================================================= */

function PageThumbnail({
  pdf,
  pageNumber,
  index,
  selected,
  onClick,
  rotation = 0,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    async function render() {
      try {
        const page = await pdf.getPage(pageNumber);

        if (cancelled) return;

        const viewport = page.getViewport({
          scale: 0.55,
          rotation,
        });

        const canvas = canvasRef.current;

        if (!canvas || cancelled) return;

        const context = canvas.getContext("2d");

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        context.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;
      } catch (err) {
        if (!cancelled) {
          console.error(
            "PDF thumbnail render failed:",
            err
          );
        }
      }
    }

    render();

    return () => {
      cancelled = true;

      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // Ignore cancelled render tasks.
        }
      }
    };
  }, [pdf, pageNumber, rotation]);

  return (
    <button
      type="button"
      className={`pdf-page-card ${
        selected ? "is-selected" : ""
      }`}
      onClick={onClick}
    >
      <div className="pdf-page-preview">
        <canvas ref={canvasRef} />
      </div>

      <div className="pdf-page-footer">
        <span>Page {index + 1}</span>

        {selected && (
          <span className="pdf-page-selected">
            ✓
          </span>
        )}
      </div>
    </button>
  );
}

/* =========================================================
   TOOL BUTTON
========================================================= */

function ToolButton({
  icon,
  title,
  description,
  active,
  disabled,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`pdf-tool-button ${
        active ? "is-active" : ""
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="pdf-tool-icon">{icon}</span>

      <span className="pdf-tool-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PDFWorkspace() {
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  const [tool, setTool] = useState("merge");

  const [selectedPages, setSelectedPages] = useState({});
  const [pageRotations, setPageRotations] = useState({});

  const [rangeInput, setRangeInput] = useState("");

  const [watermarkText, setWatermarkText] = useState(
    "FreeToolz"
  );

  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);

  const [pageNumberPosition, setPageNumberPosition] =
    useState("bottom-center");

  const [metadata, setMetadata] = useState({
    title: "",
    author: "",
    subject: "",
    keywords: "",
  });

  const [signature, setSignature] = useState(null);
  const signatureCanvasRef = useRef(null);
  const [isSigning, setIsSigning] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [processingText, setProcessingText] =
    useState("Processing your PDF...");

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const [dragging, setDragging] = useState(false);

  /* =======================================================
     ACTIVE FILE
  ======================================================= */

  const activeFile = useMemo(
    () =>
      files.find(
        (file) => file.id === activeFileId
      ) || files[0] || null,
    [files, activeFileId]
  );

  /* =======================================================
     FILE INPUT
  ======================================================= */

  async function addPDFFiles(fileList) {
    const incoming = Array.from(fileList || {}).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (!incoming.length) {
      setError("Please choose one or more PDF files.");
      return;
    }

    setError("");
    setSuccess(null);

    try {
      const loaded = [];

      for (const file of incoming) {
        loaded.push(await readPDF(file));
      }

      setFiles((current) => {
        const next = [...current, ...loaded];

        if (!activeFileId && loaded[0]) {
          setActiveFileId(loaded[0].id);
        }

        return next;
      });

      if (!activeFileId && loaded[0]) {
        setActiveFileId(loaded[0].id);
      }
    } catch (err) {
      console.error(err);
      setError(
        "FreePDF couldn't read one of those files. The PDF may be damaged, encrypted, or unsupported."
      );
    }
  }

  async function handleFileInput(event) {
    await addPDFFiles(event.target.files);
    event.target.value = "";
  }

  function removeFile(id) {
    setFiles((current) =>
      current.filter((file) => file.id !== id)
    );

    setSelectedPages((current) => {
      const copy = { ...current };
      delete copy[id];
      return copy;
    });

    setPageRotations((current) => {
      const copy = { ...current };
      delete copy[id];
      return copy;
    });

    if (activeFileId === id) {
      const remaining = files.filter(
        (file) => file.id !== id
      );

      setActiveFileId(
        remaining[0]?.id || null
      );
    }
  }

  function clearWorkspace() {
    setFiles([]);
    setActiveFileId(null);
    setSelectedPages({});
    setPageRotations({});
    setSuccess(null);
    setError("");
    setRangeInput("");
    setSignature(null);
  }

  /* =======================================================
     DRAG / DROP
  ======================================================= */

  function handleDragOver(event) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragging(false);
  }

  async function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    await addPDFFiles(event.dataTransfer.files);
  }

  /* =======================================================
     PAGE SELECTION
  ======================================================= */

  function getSelectedForFile(file) {
    return selectedPages[file.id] || [];
  }

  function togglePage(fileId, pageIndex) {
    setSelectedPages((current) => {
      const existing = current[fileId] || [];

      const next = existing.includes(pageIndex)
        ? existing.filter((page) => page !== pageIndex)
        : [...existing, pageIndex].sort(
            (a, b) => a - b
          );

      return {
        ...current,
        [fileId]: next,
      };
    });
  }

  function selectAllPages(file) {
    const pages = Array.from(
      { length: file.pages },
      (_, index) => index
    );

    setSelectedPages((current) => ({
      ...current,
      [file.id]: pages,
    }));
  }

  function clearSelectedPages(file) {
    setSelectedPages((current) => ({
      ...current,
      [file.id]: [],
    }));
  }

  function applyRangeSelection() {
    if (!activeFile) return;

    const pages = parsePageList(
      rangeInput,
      activeFile.pages
    );

    if (!pages.length) {
      setError(
        "Enter a valid page range, for example 1,3,5-7."
      );
      return;
    }

    setError("");

    setSelectedPages((current) => ({
      ...current,
      [activeFile.id]: pages,
    }));
  }

  /* =======================================================
     ROTATION
  ======================================================= */

  function rotateSelected(degreesAmount) {
    if (!activeFile) return;

    const selected = getSelectedForFile(activeFile);

    if (!selected.length) {
      setError("Select at least one page first.");
      return;
    }

    setPageRotations((current) => {
      const fileRotations = {
        ...(current[activeFile.id] || {}),
      };

      selected.forEach((pageIndex) => {
        fileRotations[pageIndex] =
          ((fileRotations[pageIndex] || 0) +
            degreesAmount +
            360) %
          360;
      });

      return {
        ...current,
        [activeFile.id]: fileRotations,
      };
    });
  }

  /* =======================================================
     PDF HELPERS
  ======================================================= */

  async function loadSourcePDF(item) {
    return PDFDocument.load(
      new Uint8Array(item.buffer)
    );
  }

  async function createPDFFromPages(
    source,
    pageIndexes,
    rotations = {}
  ) {
    const output = await PDFDocument.create();

    const copiedPages = await output.copyPages(
      source,
      pageIndexes
    );

    copiedPages.forEach((page, index) => {
      const originalIndex = pageIndexes[index];

      if (rotations[originalIndex]) {
        page.setRotation(
          degrees(
            rotations[originalIndex]
          )
        );
      }

      output.addPage(page);
    });

    return output;
  }

  /* =======================================================
     MERGE
  ======================================================= */

  async function mergePDFs() {
    if (files.length < 2) {
      setError(
        "Add at least two PDF files to merge them."
      );
      return;
    }

    setProcessing(true);
    setProcessingText(
      "Merging your PDF files..."
    );
    setError("");
    setSuccess(null);

    try {
      const mergedPdf = await PDFDocument.create();

      let totalPages = 0;

      for (const item of files) {
        const sourcePdf = await loadSourcePDF(item);

        const indexes =
          sourcePdf.getPageIndices();

        const copiedPages =
          await mergedPdf.copyPages(
            sourcePdf,
            indexes
          );

        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });

        totalPages += indexes.length;
      }

      const mergedBytes =
        await mergedPdf.save();

      setSuccess({
        bytes: mergedBytes,
        filename: "FreeToolz-Merged.pdf",
        size: mergedBytes.byteLength,
        pages: totalPages,
      });
    } catch (err) {
      console.error(err);

      setError(
        "FreePDF couldn't merge these files. One of the PDFs may be damaged, encrypted, or unsupported."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =======================================================
     EXTRACT
  ======================================================= */

  async function extractPages() {
    if (!activeFile) return;

    const selected =
      getSelectedForFile(activeFile);

    if (!selected.length) {
      setError(
        "Select the pages you want to extract."
      );
      return;
    }

    setProcessing(true);
    setProcessingText(
      "Extracting selected pages..."
    );
    setError("");
    setSuccess(null);

    try {
      const source =
        await loadSourcePDF(activeFile);

      const output =
        await createPDFFromPages(
          source,
          selected,
          pageRotations[activeFile.id] || {}
        );

      const bytes = await output.save();

      setSuccess({
        bytes,
        filename: "FreeToolz-Extracted-Pages.pdf",
        size: bytes.byteLength,
        pages: selected.length,
      });
    } catch (err) {
      console.error(err);
      setError(
        "The selected pages couldn't be extracted."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deletePages() {
    if (!activeFile) return;

    const selected =
      getSelectedForFile(activeFile);

    if (!selected.length) {
      setError(
        "Select the pages you want to delete."
      );
      return;
    }

    if (selected.length >= activeFile.pages) {
      setError(
        "You cannot delete every page from a PDF."
      );
      return;
    }

    setProcessing(true);
    setProcessingText(
      "Removing selected pages..."
    );
    setError("");
    setSuccess(null);

    try {
      const source =
        await loadSourcePDF(activeFile);

      const keepPages = source
        .getPageIndices()
        .filter(
          (index) => !selected.includes(index)
        );

      const output =
        await createPDFFromPages(
          source,
          keepPages,
          pageRotations[activeFile.id] || {}
        );

      const bytes = await output.save();

      setSuccess({
        bytes,
        filename: "FreeToolz-Edited-Pages.pdf",
        size: bytes.byteLength,
        pages: keepPages.length,
      });
    } catch (err) {
      console.error(err);
      setError(
        "The selected pages couldn't be removed."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =======================================================
     SPLIT EVERY PAGE
  ======================================================= */

  async function splitEveryPage() {
    if (!activeFile) return;

    setProcessing(true);
    setProcessingText(
      "Preparing individual page PDFs..."
    );
    setError("");
    setSuccess(null);

    try {
      const source =
        await loadSourcePDF(activeFile);

      const pageIndexes =
        source.getPageIndices();

      /*
       * Browser-native downloads are intentionally used here.
       * Each page becomes a separate PDF.
       */
      for (
        let index = 0;
        index < pageIndexes.length;
        index++
      ) {
        setProcessingText(
          `Creating page ${index + 1} of ${pageIndexes.length}...`
        );

        const output =
          await PDFDocument.create();

        const copied =
          await output.copyPages(
            source,
            [pageIndexes[index]]
          );

        output.addPage(copied[0]);

        const bytes =
          await output.save();

        downloadBytes(
          bytes,
          `FreeToolz-Page-${index + 1}.pdf`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 100)
        );
      }

      setSuccess({
        filename: `${activeFile.name.replace(
          /\.pdf$/i,
          ""
        )}-Split`,
        size: activeFile.size,
        pages: pageIndexes.length,
        multiple: true,
      });
    } catch (err) {
      console.error(err);
      setError(
        "The PDF couldn't be split into individual pages."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =======================================================
     REARRANGE
  ======================================================= */

  async function rearrangePages() {
    if (!activeFile) return;

    const selected =
      getSelectedForFile(activeFile);

    if (
      selected.length !== activeFile.pages
    ) {
      setError(
        "Select all pages in the order you want, then use the move controls."
      );
      return;
    }

    setProcessing(true);
    setProcessingText(
      "Rearranging your pages..."
    );
    setError("");
    setSuccess(null);

    try {
      const source =
        await loadSourcePDF(activeFile);

      const output =
        await createPDFFromPages(
          source,
          selected,
          pageRotations[activeFile.id] || {}
        );

      const bytes = await output.save();

      setSuccess({
        bytes,
        filename: "FreeToolz-Rearranged.pdf",
        size: bytes.byteLength,
        pages: selected.length,
      });
    } catch (err) {
      console.error(err);
      setError(
        "The pages couldn't be rearranged."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =======================================================
     ROTATE / EXPORT
  ======================================================= */

  async function rotateAndExport() {
    if (!activeFile) return;

    const rotations =
      pageRotations[activeFile.id] || {};

    const indexes =
      activeFile.pdf
        ? activeFile.pdf
            .getPageIndices()
        : Array.from(
            { length: activeFile.pages },
            (_, index) => index
          );

    setProcessing(true);
    setProcessingText(
      "Applying page rotations..."
    );
    setError("");
    setSuccess(null);

    try {
      const source =
        await loadSourcePDF(activeFile);

      const output =
        await createPDFFromPages(
          source,
          indexes,
          rotations
        );

      const bytes = await output.save();

      setSuccess({
        bytes,
        filename: "FreeToolz-Rotated.pdf",
        size: bytes.byteLength,
        pages: indexes.length,
      });
    } catch (err) {
      console.error(err);
      setError(
        "The page rotations couldn't be applied."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =======================================================
     PDF → IMAGE
  ======================================================= */

  async function exportPDFAsImages(format) {
    if (!activeFile) return;

    setProcessing(true);
    setProcessingText(
      "Rendering PDF pages..."
    );
    setError("");
    setSuccess(null);

    try {
      for (
        let index = 1;
        index <= activeFile.pdf.numPages;
        index++
      ) {
        setProcessingText(
          `Rendering page ${index} of ${activeFile.pdf.numPages}...`
        );

        const page =
          await activeFile.pdf.getPage(index);

        const viewport =
          page.getViewport({
            scale: 2,
          });

        const canvas =
          document.createElement("canvas");

        const context =
          canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        const mime =
          format === "jpg"
            ? "image/jpeg"
            : "image/png";

        const blob =
          await new Promise((resolve) =>
            canvas.toBlob(
              resolve,
              mime,
              format === "jpg"
                ? 0.92
                : undefined
            )
          );

        if (!blob) {
          throw new Error(
            "Image conversion failed."
          );
        }

        downloadBlob(
          blob,
          `FreeToolz-Page-${index}.${format}`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 120)
        );
      }

      setSuccess({
        filename: `FreeToolz-PDF-to-${format.toUpperCase()}`,
        pages: activeFile.pdf.numPages,
        multiple: true,
      });
    } catch (err) {
      console.error(err);
      setError(
        "The PDF couldn't be converted into images."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =======================================================
     IMAGES → PDF
  ======================================================= */

  async function handleImages(filesList) {
    const images = Array.from(
      filesList || {}
    ).filter((file) =>
      /^image\/(png|jpe?g)$/i.test(
        file.type
      )
    );

    if (!images.length) {
      setError(
        "Please choose JPG or PNG images."
      );
      return;
    }

    setProcessing(true);
    setProcessingText(
      "Building your PDF from images..."
    );
    setError("");
    setSuccess(null);

    try {
      const pdf =
        await PDFDocument.create();

      for (const imageFile of images) {
        const bytes =
          new Uint8Array(
            await imageFile.arrayBuffer()
          );

        let image;

        if (
          imageFile.type ===
          "image/png"
        ) {
          image =
            await pdf.embedPng(bytes);
        } else {
          image =
            await pdf.embedJpg(bytes);
        }

        const maxWidth = 595;
        const maxHeight = 842;

        const scale = Math.min(
          maxWidth / image.width,
          maxHeight / image.height,
          1
        );

        const width =
          image.width * scale;

        const height =
          image.height * scale;

        const page =
          pdf.addPage([
            width,
            height,
          ]);

        page.drawImage(image, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      const bytes =
        await pdf.save();

      setSuccess({
        bytes,
        filename:
          "FreeToolz-Images-to-PDF.pdf",
        size: bytes.byteLength,
        pages: images.length,
      });
    } catch (err) {
      console.error(err);
      setError(
        "The images couldn't be converted into a PDF."
      );
    } finally {
      setProcessing(false);
    }
  }

  function triggerImageInput() {
    imageInputRef.current?.click();
  }

  async function handleImageInput(event) {
    await handleImages(
      event.target.files
    );

    event.target.value = "";
  }

  /* =======================================================
     PAGE NUMBERS
  ======================================================= */

  async function addPageNumbers() {
    if (!activeFile) return;

    setProcessing(true);
    setProcessingText(
      "Adding page numbers..."
    );
    setError("");
    setSuccess(null);

    try {
      const source =
        await loadSourcePDF(activeFile);

      const pages =
        source.getPages();

      const font =
        await source.embedFont(
          StandardFonts.Helvetica
        );

      pages.forEach((page, index) => {
        const { width, height } =
          page.getSize();

        const text =
          `${index + 1} / ${pages.length}`;

        const fontSize = 10;

        let x =
          width / 2 - 15;

        let y = 18;

        if (
          pageNumberPosition ===
          "bottom-left"
        ) {
          x = 24;
        }

        if (
          pageNumberPosition ===
          "bottom-right"
        ) {
          x = width - 55;
        }

        if (
          pageNumberPosition ===
          "top-center"
        ) {
          y = height - 24;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(
            0.18,
            0.2,
            0.2
          ),
        });
      });

      const bytes =
        await source.save();

      setSuccess({
        bytes,
        filename:
          "FreeToolz-Page-Numbers.pdf",
        size: bytes.byteLength,
        pages: pages.length,
      });
    } catch (err) {
      console.error(err);
      setError(
        "Page numbers couldn't be added."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =======================================================
     WATERMARK
  ======================================================= */

  async function addWatermark() {
    if (!activeFile) return;

    if (!watermarkText.trim()) {
      setError(
        "Enter watermark text first."
      );
      return;
    }

    setProcessing(true);
    setProcessingText(
      "Applying your watermark..."
    );
    setError("");
    setSuccess(null);

    try {
      const source =
        await loadSourcePDF(activeFile);

      const font =
        await source.embedFont(
          StandardFonts.HelveticaBold
        );

      source.getPages().forEach((page) => {
        const { width, height } =
          page.getSize();

        const fontSize =
          Math.min(width, height) * 0.08;

        const textWidth =
          font.widthOfTextAtSize(
            watermarkText,
            fontSize
          );

        page.drawText(
          watermarkText,
          {
            x:
              width / 2 -
              textWidth / 2,
            y:
              height / 2 -
              fontSize / 2,
            size: fontSize,
            font,
            color: rgb(
              0.18,
              0.55,
              0.42
            ),
            opacity:
              clamp(
                watermarkOpacity,
                0.05,
                0.8
              ),
            rotate: degrees(-35),
          }
        );
      });

      const bytes =
        await source.save();

      setSuccess({
        bytes,
        filename:
          "FreeToolz-Watermarked.pdf",
        size: bytes.byteLength,
        pages: source.getPageCount(),
      });
    } catch (err) {
      console.error(err);
      setError(
        "The watermark couldn't be added."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =======================================================
     METADATA
  ======================================================= */

  async function editMetadata() {
    if (!activeFile) return;

    setProcessing(true);
    setProcessingText(
      "Updating PDF metadata..."
    );
    setError("");
    setSuccess(null);

    try {
      const source =
        await loadSourcePDF(activeFile);

      source.setTitle(
        metadata.title || ""
      );

      source.setAuthor(
        metadata.author || ""
      );

      source.setSubject(
        metadata.subject || ""
      );

      source.setKeywords(
        metadata.keywords
          ? metadata.keywords
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : []
      );

      const bytes =
        await source.save();

      setSuccess({
        bytes,
        filename:
          "FreeToolz-Metadata-Updated.pdf",
        size: bytes.byteLength,
        pages: source.getPageCount(),
      });
    } catch (err) {
      console.error(err);
      setError(
        "The PDF metadata couldn't be updated."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =======================================================
     SIGNATURE CANVAS
  ======================================================= */

  function beginSignature() {
    setIsSigning(true);

    requestAnimationFrame(() => {
      const canvas =
        signatureCanvasRef.current;

      if (!canvas) return;

      const context =
        canvas.getContext("2d");

      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      context.lineWidth = 3;
      context.lineCap = "round";
      context.lineJoin = "round";
    });
  }

  function getCanvasPoint(event) {
    const canvas =
      signatureCanvasRef.current;

    const rect =
      canvas.getBoundingClientRect();

    return {
      x:
        ((event.clientX - rect.left) /
          rect.width) *
        canvas.width,

      y:
        ((event.clientY - rect.top) /
          rect.height) *
        canvas.height,
    };
  }

  function signaturePointerDown(event) {
    const canvas =
      signatureCanvasRef.current;

    if (!canvas) return;

    const context =
      canvas.getContext("2d");

    const point =
      getCanvasPoint(event);

    canvas.setPointerCapture(
      event.pointerId
    );

    context.beginPath();
    context.moveTo(
      point.x,
      point.y
    );

    setIsSigning(true);
  }

  function signaturePointerMove(event) {
    const canvas =
      signatureCanvasRef.current;

    if (!canvas) return;

    if (
      !canvas.hasPointerCapture(
        event.pointerId
      )
    ) {
      return;
    }

    const context =
      canvas.getContext("2d");

    const point =
      getCanvasPoint(event);

    context.lineTo(
      point.x,
      point.y
    );

    context.stroke();
  }

  function clearSignature() {
    const canvas =
      signatureCanvasRef.current;

    if (!canvas) return;

    canvas
      .getContext("2d")
      .clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

    setSignature(null);
  }

  function saveSignature() {
    const canvas =
      signatureCanvasRef.current;

    if (!canvas) return;

    const dataUrl =
      canvas.toDataURL(
        "image/png"
      );

    setSignature(dataUrl);
    setIsSigning(false);
  }

  /* =======================================================
     SIGN PDF
  ======================================================= */

  async function signPDF() {
    if (!activeFile) return;

    if (!signature) {
      setError(
        "Draw and save a signature first."
      );
      return;
    }

    setProcessing(true);
    setProcessingText(
      "Adding your signature..."
    );
    setError("");
    setSuccess(null);

    try {
      const source =
        await loadSourcePDF(activeFile);

      const signatureBytes =
        await fetch(signature)
          .then((response) =>
            response.arrayBuffer()
          )
          .then(
            (buffer) =>
              new Uint8Array(buffer)
          );

      const signatureImage =
        await source.embedPng(
          signatureBytes
        );

      const lastPage =
        source.getPages()[
          source.getPageCount() - 1
        ];

      const { width } =
        lastPage.getSize();

      const signatureWidth =
        Math.min(180, width * 0.28);

      const signatureHeight =
        signatureWidth * 0.32;

      lastPage.drawImage(
        signatureImage,
        {
          x: 36,
          y: 36,
          width: signatureWidth,
          height: signatureHeight,
        }
      );

      const bytes =
        await source.save();

      setSuccess({
        bytes,
        filename:
          "FreeToolz-Signed.pdf",
        size: bytes.byteLength,
        pages: source.getPageCount(),
      });
    } catch (err) {
      console.error(err);
      setError(
        "The signature couldn't be added."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =======================================================
     TOOL EXECUTOR
  ======================================================= */

  function executeTool() {
    switch (tool) {
      case "merge":
        return mergePDFs();

      case "split":
        return splitEveryPage();

      case "extract":
        return extractPages();

      case "delete":
        return deletePages();

      case "rotate":
        return rotateAndExport();

      case "numbers":
        return addPageNumbers();

      case "watermark":
        return addWatermark();

      case "metadata":
        return editMetadata();

      case "signature":
        return signPDF();

      case "pdf-jpg":
        return exportPDFAsImages("jpg");

      case "pdf-png":
        return exportPDFAsImages("png");

      case "images-pdf":
        return triggerImageInput();

      default:
        return null;
    }
  }

  /* =======================================================
     TOOL DATA
  ======================================================= */

  const tools = [
    {
      id: "merge",
      icon: "✦",
      title: "Merge",
      description: "Combine PDFs",
    },
    {
      id: "split",
      icon: "✂",
      title: "Split",
      description: "One PDF per page",
    },
    {
      id: "extract",
      icon: "▣",
      title: "Extract",
      description: "Keep selected pages",
    },
    {
      id: "delete",
      icon: "⌫",
      title: "Delete",
      description: "Remove pages",
    },
    {
      id: "rotate",
      icon: "↻",
      title: "Rotate",
      description: "Rotate pages",
    },
    {
      id: "pdf-jpg",
      icon: "▧",
      title: "PDF → JPG",
      description: "Convert pages",
    },
    {
      id: "pdf-png",
      icon: "▤",
      title: "PDF → PNG",
      description: "Convert pages",
    },
    {
      id: "images-pdf",
      icon: "▥",
      title: "Images → PDF",
      description: "Build a PDF",
    },
    {
      id: "numbers",
      icon: "#",
      title: "Page Numbers",
      description: "Number every page",
    },
    {
      id: "watermark",
      icon: "◇",
      title: "Watermark",
      description: "Add text watermark",
    },
    {
      id: "metadata",
      icon: "ⓘ",
      title: "Metadata",
      description: "Edit document info",
    },
    {
      id: "signature",
      icon: "✎",
      title: "Sign",
      description: "Draw your signature",
    },
  ];

  /* =======================================================
     SUCCESS
  ======================================================= */

  if (success) {
    return (
      <section className="pdf-workspace-shell">
        <div className="pdf-success-state">
          <div className="pdf-success-orb">
            ✓
          </div>

          <div className="pdf-success-eyebrow">
            FREEPDF COMPLETE
          </div>

          <h2>
            Your PDF is ready.
          </h2>

          <p>
            Everything was processed directly
            in your browser.
          </p>

          <div className="pdf-success-meta">
            {success.pages && (
              <span>
                {success.pages}{" "}
                {success.pages === 1
                  ? "page"
                  : "pages"}
              </span>
            )}

            {success.size && (
              <span>
                {formatBytes(
                  success.size
                )}
              </span>
            )}
          </div>

          {success.bytes && (
            <button
              type="button"
              className="pdf-primary-action"
              onClick={() =>
                downloadBytes(
                  success.bytes,
                  success.filename
                )
              }
            >
              ↓ Download PDF
            </button>
          )}

          {success.multiple && (
            <div className="pdf-multiple-note">
              Your individual files were
              downloaded separately.
            </div>
          )}

          <button
            type="button"
            className="pdf-secondary-action"
            onClick={() =>
              setSuccess(null)
            }
          >
            ← Back to workspace
          </button>
        </div>
      </section>
    );
  }

  /* =======================================================
     PROCESSING
  ======================================================= */

  if (processing) {
    return (
      <section className="pdf-workspace-shell">
        <div className="pdf-processing-state">
          <div className="pdf-processing-ring">
            <span />
          </div>

          <div className="pdf-success-eyebrow">
            FREEPDF
          </div>

          <h2>
            Working on it.
          </h2>

          <p>{processingText}</p>

          <div className="pdf-processing-bar">
            <span />
          </div>

          <small>
            Your files stay in your browser
            during processing.
          </small>
        </div>
      </section>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <section
      className={`pdf-workspace-shell ${
        dragging
          ? "is-dragging"
          : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={handleFileInput}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg"
        multiple
        hidden
        onChange={handleImageInput}
      />

      <div className="pdf-workspace-header">
        <div>
          <div className="pdf-workspace-kicker">
            FREEPDF WORKSPACE
          </div>

          <h2>
            Drop a PDF.
            <br />
            <span>
              Do something with it.
            </span>
          </h2>

          <p>
            Professional PDF tools without
            uploads, accounts, watermarks or
            artificial limits.
          </p>
        </div>

        <div className="pdf-privacy-badge">
          <span>●</span>
          Runs in your browser
        </div>
      </div>

      {error && (
        <div className="pdf-error-banner">
          <span>!</span>
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {!files.length ? (
        <div className="pdf-drop-zone">
          <div className="pdf-drop-icon">
            ↑
          </div>

          <h3>
            Drop your PDFs here
          </h3>

          <p>
            or choose files from your device
          </p>

          <button
            type="button"
            className="pdf-primary-action"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            Choose PDF files
          </button>

          <div className="pdf-drop-hint">
            Multiple files supported
          </div>
        </div>
      ) : (
        <>
          <div className="pdf-file-strip">
            {files.map((file) => (
              <button
                type="button"
                key={file.id}
                className={`pdf-file-chip ${
                  activeFile?.id === file.id
                    ? "is-active"
                    : ""
                }`}
                onClick={() =>
                  setActiveFileId(file.id)
                }
              >
                <span className="pdf-file-chip-icon">
                  PDF
                </span>

                <span>
                  <strong>
                    {file.name}
                  </strong>

                  <small>
                    {file.pages} pages ·{" "}
                    {formatBytes(
                      file.size
                    )}
                  </small>
                </span>

                <span
                  className="pdf-file-remove"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFile(file.id);
                  }}
                >
                  ×
                </span>
              </button>
            ))}

            <button
              type="button"
              className="pdf-add-file-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              + Add PDF
            </button>
          </div>

          <div className="pdf-workspace-layout">
            <aside className="pdf-tool-panel">
              <div className="pdf-panel-label">
                TOOLS
              </div>

              {tools.map((item) => (
                <ToolButton
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  description={
                    item.description
                  }
                  active={
                    tool === item.id
                  }
                  onClick={() => {
                    setTool(item.id);
                    setError("");
                  }}
                />
              ))}

              <div className="pdf-panel-divider" />

              <button
                type="button"
                className="pdf-clear-button"
                onClick={clearWorkspace}
              >
                Clear workspace
              </button>
            </aside>

            <main className="pdf-editor-panel">
              <div className="pdf-editor-toolbar">
                <div>
                  <strong>
                    {activeFile?.name}
                  </strong>

                  <span>
                    {activeFile?.pages} pages ·{" "}
                    {formatBytes(
                      activeFile?.size || 0
                    )}
                  </span>
                </div>

                <div className="pdf-toolbar-actions">
                  <button
                    type="button"
                    onClick={() =>
                      selectAllPages(
                        activeFile
                      )
                    }
                  >
                    Select all
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      clearSelectedPages(
                        activeFile
                      )
                    }
                  >
                    Clear
                  </button>
                </div>
              </div>

              {[
                "extract",
                "delete",
                "rotate",
                "rearrange",
              ].includes(tool) && (
                <div className="pdf-selection-bar">
                  <span>
                    Select pages
                  </span>

                  <input
                    value={rangeInput}
                    onChange={(event) =>
                      setRangeInput(
                        event.target.value
                      )
                    }
                    placeholder="e.g. 1,3,5-7"
                  />

                  <button
                    type="button"
                    onClick={
                      applyRangeSelection
                    }
                  >
                    Apply
                  </button>

                  <strong>
                    {
                      getSelectedForFile(
                        activeFile
                      ).length
                    }{" "}
                    selected
                  </strong>
                </div>
              )}

<div className="pdf-page-grid">
  {activeFile?.pdf &&
    Array.from(
      {
        length: activeFile.pages,
      },
      (_, index) => (
        <PageThumbnail
          key={`${activeFile.id}-${index}`}
          pdf={activeFile.pdf}
          pageNumber={index + 1}
          index={index}
          selected={getSelectedForFile(
            activeFile
          ).includes(index)}
          onClick={() =>
            togglePage(
              activeFile.id,
              index
            )
          }
          rotation={
            (
              pageRotations[
                activeFile.id
              ] || {}
            )[index] || 0
          }
        />
      )
    )}
</div>

              {/* =================================================
                  TOOL OPTIONS
              ================================================= */}

              {tool === "merge" && (
                <div className="pdf-action-card">
                  <div>
                    <span className="pdf-action-card-label">
                      MERGE
                    </span>

                    <h3>
                      Combine all selected
                      PDFs into one.
                    </h3>

                    <p>
                      Files are combined in the
                      order shown above.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="pdf-primary-action"
                    disabled={
                      files.length < 2
                    }
                    onClick={
                      mergePDFs
                    }
                  >
                    Merge PDFs →
                  </button>
                </div>
              )}

              {tool === "split" && (
                <div className="pdf-action-card">
                  <div>
                    <span className="pdf-action-card-label">
                      SPLIT
                    </span>

                    <h3>
                      Turn every page into
                      its own PDF.
                    </h3>

                    <p>
                      Each page will be
                      downloaded as an
                      individual PDF.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="pdf-primary-action"
                    onClick={
                      splitEveryPage
                    }
                  >
                    Split PDF →
                  </button>
                </div>
              )}

              {tool === "extract" && (
                <div className="pdf-action-card">
                  <div>
                    <span className="pdf-action-card-label">
                      EXTRACT
                    </span>

                    <h3>
                      Keep only the pages
                      you select.
                    </h3>

                    <p>
                      Use the page selector
                      above or click the
                      thumbnails.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="pdf-primary-action"
                    onClick={
                      extractPages
                    }
                  >
                    Extract pages →
                  </button>
                </div>
              )}

              {tool === "delete" && (
                <div className="pdf-action-card">
                  <div>
                    <span className="pdf-action-card-label">
                      DELETE
                    </span>

                    <h3>
                      Remove unwanted
                      pages.
                    </h3>

                    <p>
                      Select the pages
                      you don't want.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="pdf-primary-action"
                    onClick={
                      deletePages
                    }
                  >
                    Delete pages →
                  </button>
                </div>
              )}

              {tool === "rotate" && (
                <div className="pdf-action-card">
                  <div>
                    <span className="pdf-action-card-label">
                      ROTATE
                    </span>

                    <h3>
                      Rotate selected pages.
                    </h3>

                    <p>
                      Select one or more
                      pages, then choose a
                      rotation.
                    </p>
                  </div>

                  <div className="pdf-action-buttons">
                    <button
                      type="button"
                      onClick={() =>
                        rotateSelected(
                          -90
                        )
                      }
                    >
                      ↺ 90°
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        rotateSelected(
                          90
                        )
                      }
                    >
                      ↻ 90°
                    </button>

                    <button
                      type="button"
                      className="pdf-primary-action"
                      onClick={
                        rotateAndExport
                      }
                    >
                      Apply →
                    </button>
                  </div>
                </div>
              )}

              {(tool === "pdf-jpg" ||
                tool === "pdf-png") && (
                <div className="pdf-action-card">
                  <div>
                    <span className="pdf-action-card-label">
                      CONVERT
                    </span>

                    <h3>
                      Export PDF pages as
                      images.
                    </h3>

                    <p>
                      High-resolution images
                      are generated directly
                      in your browser.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="pdf-primary-action"
                    onClick={
                      executeTool
                    }
                  >
                    Convert →
                  </button>
                </div>
              )}

              {tool === "images-pdf" && (
                <div className="pdf-action-card">
                  <div>
                    <span className="pdf-action-card-label">
                      IMAGE → PDF
                    </span>

                    <h3>
                      Turn JPGs or PNGs into
                      a PDF.
                    </h3>

                    <p>
                      Choose multiple images
                      and FreePDF will combine
                      them into one document.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="pdf-primary-action"
                    onClick={
                      triggerImageInput
                    }
                  >
                    Choose images →
                  </button>
                </div>
              )}

              {tool === "numbers" && (
                <div className="pdf-action-card">
                  <div>
                    <span className="pdf-action-card-label">
                      PAGE NUMBERS
                    </span>

                    <h3>
                      Add clean page
                      numbering.
                    </h3>

                    <select
                      value={
                        pageNumberPosition
                      }
                      onChange={(event) =>
                        setPageNumberPosition(
                          event.target.value
                        )
                      }
                    >
                      <option value="bottom-center">
                        Bottom center
                      </option>

                      <option value="bottom-left">
                        Bottom left
                      </option>

                      <option value="bottom-right">
                        Bottom right
                      </option>

                      <option value="top-center">
                        Top center
                      </option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="pdf-primary-action"
                    onClick={
                      addPageNumbers
                    }
                  >
                    Add numbers →
                  </button>
                </div>
              )}

              {tool === "watermark" && (
                <div className="pdf-action-card">
                  <div>
                    <span className="pdf-action-card-label">
                      WATERMARK
                    </span>

                    <h3>
                      Add a subtle document
                      watermark.
                    </h3>

                    <div className="pdf-options-grid">
                      <label>
                        Text
                        <input
                          value={
                            watermarkText
                          }
                          onChange={(
                            event
                          ) =>
                            setWatermarkText(
                              event.target
                                .value
                            )
                          }
                        />
                      </label>

                      <label>
                        Opacity
                        <input
                          type="range"
                          min="0.05"
                          max="0.8"
                          step="0.05"
                          value={
                            watermarkOpacity
                          }
                          onChange={(
                            event
                          ) =>
                            setWatermarkOpacity(
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="pdf-primary-action"
                    onClick={
                      addWatermark
                    }
                  >
                    Add watermark →
                  </button>
                </div>
              )}

              {tool === "metadata" && (
                <div className="pdf-action-card">
                  <div>
                    <span className="pdf-action-card-label">
                      METADATA
                    </span>

                    <h3>
                      Edit document
                      information.
                    </h3>

                    <div className="pdf-options-grid pdf-metadata-grid">
                      <label>
                        Title
                        <input
                          value={
                            metadata.title
                          }
                          onChange={(
                            event
                          ) =>
                            setMetadata(
                              (
                                current
                              ) => ({
                                ...current,
                                title:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                        />
                      </label>

                      <label>
                        Author
                        <input
                          value={
                            metadata.author
                          }
                          onChange={(
                            event
                          ) =>
                            setMetadata(
                              (
                                current
                              ) => ({
                                ...current,
                                author:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                        />
                      </label>

                      <label>
                        Subject
                        <input
                          value={
                            metadata.subject
                          }
                          onChange={(
                            event
                          ) =>
                            setMetadata(
                              (
                                current
                              ) => ({
                                ...current,
                                subject:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                        />
                      </label>

                      <label>
                        Keywords
                        <input
                          value={
                            metadata.keywords
                          }
                          placeholder="pdf, document, report"
                          onChange={(
                            event
                          ) =>
                            setMetadata(
                              (
                                current
                              ) => ({
                                ...current,
                                keywords:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="pdf-primary-action"
                    onClick={
                      editMetadata
                    }
                  >
                    Update metadata →
                  </button>
                </div>
              )}

              {tool === "signature" && (
                <div className="pdf-action-card">
                  <div>
                    <span className="pdf-action-card-label">
                      SIGN
                    </span>

                    <h3>
                      Draw your signature
                      directly in FreePDF.
                    </h3>

                    {!isSigning &&
                      !signature && (
                        <button
                          type="button"
                          className="pdf-secondary-action"
                          onClick={
                            beginSignature
                          }
                        >
                          Open signature pad
                        </button>
                      )}

                    {isSigning && (
                      <div className="pdf-signature-box">
                        <canvas
                          ref={
                            signatureCanvasRef
                          }
                          width={700}
                          height={240}
                          onPointerDown={
                            signaturePointerDown
                          }
                          onPointerMove={
                            signaturePointerMove
                          }
                        />

                        <div>
                          <button
                            type="button"
                            onClick={
                              clearSignature
                            }
                          >
                            Clear
                          </button>

                          <button
                            type="button"
                            className="pdf-primary-action"
                            onClick={
                              saveSignature
                            }
                          >
                            Save signature
                          </button>
                        </div>
                      </div>
                    )}

                    {signature &&
                      !isSigning && (
                        <div className="pdf-signature-saved">
                          <img
                            src={
                              signature
                            }
                            alt="Signature preview"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setSignature(
                                null
                              );
                              beginSignature();
                            }}
                          >
                            Redraw
                          </button>
                        </div>
                      )}
                  </div>

                  <button
                    type="button"
                    className="pdf-primary-action"
                    disabled={!signature}
                    onClick={signPDF}
                  >
                    Sign PDF →
                  </button>
                </div>
              )}
            </main>
          </div>
        </>
      )}

      <div className="pdf-workspace-footer">
        <span>
          🔒 Files are processed locally in
          your browser.
        </span>

        <span>
          No account · No watermark · No
          artificial limits
        </span>
      </div>
    </section>
  );
}
