export function isPdfFilename(filename) {
  return typeof filename === "string" && /\.pdf$/i.test(filename.trim());
}
