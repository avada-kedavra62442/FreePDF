import { PDFDocument } from "pdf-lib";

self.onmessage = async (event) => {
  const { pdfFiles } = event.data;

  try {
    if (!pdfFiles?.length) {
      throw new Error("No PDF files were provided.");
    }

    self.postMessage({
      type: "progress",
      message: "Preparing PDFs…",
    });

    const mergedPdf = await PDFDocument.create();

    for (let index = 0; index < pdfFiles.length; index += 1) {
      const item = pdfFiles[index];

      self.postMessage({
        type: "progress",
        message: `Merging PDF ${index + 1} of ${pdfFiles.length}…`,
      });

      const sourcePdf = await PDFDocument.load(
        new Uint8Array(item.bytes)
      );

      const copiedPages = await mergedPdf.copyPages(
        sourcePdf,
        sourcePdf.getPageIndices()
      );

      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    self.postMessage({
      type: "progress",
      message: "Creating merged PDF…",
    });

    const bytes = await mergedPdf.save();

    self.postMessage(
      {
        type: "complete",
        bytes,
      },
      [bytes.buffer]
    );
  } catch (error) {
    self.postMessage({
      type: "error",
      message:
        error?.message ||
        "PDF merging failed. Please try again.",
    });
  }
};
