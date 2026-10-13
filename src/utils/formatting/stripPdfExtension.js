// Removes a trailing PDF extension and provides a safe fallback label.
export function stripPdfExtension(filename) {
  return String(filename ?? "").replace(/\.pdf$/i, "").trim() || "Document";
}
