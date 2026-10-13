import { PDF_FILE_EXTENSION, PDF_MIME_TYPE } from "../../constants/pdfLimits.js";
export function isPdfFile(file) {
  if (!file) return false;
  return file.type === PDF_MIME_TYPE || String(file.name || "").toLowerCase().endsWith(PDF_FILE_EXTENSION);
}
