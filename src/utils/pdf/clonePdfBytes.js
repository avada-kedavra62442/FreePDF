export function clonePdfBytes(bytes) {
  if (bytes instanceof Uint8Array) return new Uint8Array(bytes);
  if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes.slice(0));
  if (ArrayBuffer.isView(bytes)) return new Uint8Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  throw new TypeError("Expected PDF bytes as an ArrayBuffer or typed array.");
}
