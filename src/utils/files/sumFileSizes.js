export function sumFileSizes(files) {
  return Array.from(files || []).reduce((total, file) => total + (Number.isFinite(file?.size) ? file.size : 0), 0);
}
