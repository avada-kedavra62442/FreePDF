import { isPdfFile } from "./isPdfFile.js";
export function filterPdfFiles(files) {
  return Array.from(files || []).filter(isPdfFile);
}
