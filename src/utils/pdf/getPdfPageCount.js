export function getPdfPageCount(pdfDocument) {
  if (!pdfDocument || typeof pdfDocument.getPageCount !== "function") return 0;
  return pdfDocument.getPageCount();
}
