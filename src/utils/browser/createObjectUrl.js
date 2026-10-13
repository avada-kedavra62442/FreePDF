export function createObjectUrl(blob) {
  if (!(blob instanceof Blob)) throw new TypeError("A Blob is required to create a download URL.");
  return URL.createObjectURL(blob);
}
