import { PDFDocument } from "pdf-lib";

self.onmessage = async (event) => {
  const { pdfBytes, groups } = event.data;

  try {
    if (!pdfBytes) {
      throw new Error("No PDF data was provided.");
    }

    if (!groups?.length) {
      throw new Error("No PDF sections were provided.");
    }

    self.postMessage({
      type: "progress",
      message: "Preparing PDF…",
    });

    const sourcePdf = await PDFDocument.load(
      new Uint8Array(pdfBytes)
    );

    const files = [];

    for (let index = 0; index < groups.length; index += 1) {
      const group = groups[index];

      self.postMessage({
        type: "progress",
        message: `Creating PDF ${index + 1} of ${groups.length}…`,
      });

      const outputPdf = await PDFDocument.create();

      const sourceIndexes = group.pages.map(
        (pageNumber) => pageNumber - 1
      );

      const copiedPages = await outputPdf.copyPages(
        sourcePdf,
        sourceIndexes
      );

      copiedPages.forEach((page) => {
        outputPdf.addPage(page);
      });

      const bytes = await outputPdf.save();

      files.push({
        bytes,
        pages: group.pages.length,
        start: group.start,
        end: group.end,
      });
    }

    self.postMessage(
      {
        type: "complete",
        files,
      },
      files.map((file) => file.bytes.buffer)
    );
  } catch (error) {
    self.postMessage({
      type: "error",
      message:
        error?.message ||
        "PDF splitting failed. Please try again.",
    });
  }
};
