let pdfjsPromise = null;

export async function loadPDFJS() {
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
