export function buildOutputFilename(name, suffix = "", extension = ".pdf") {
  const base = String(name || "document").replace(/\.[^.]+$/, "").trim() || "document";
  const normalizedSuffix = suffix ? `-${String(suffix).replace(/^[-_]+/, "")}` : "";
  const normalizedExtension = String(extension || ".pdf").startsWith(".") ? String(extension || ".pdf") : `.${extension}`;
  return `${base}${normalizedSuffix}${normalizedExtension}`;
}
