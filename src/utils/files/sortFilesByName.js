export function sortFilesByName(files, direction = "asc") {
  const factor = direction === "desc" ? -1 : 1;
  return [...(files || [])].sort((a, b) =>
    String(a?.name || "").localeCompare(String(b?.name || ""), undefined, { numeric: true, sensitivity: "base" }) * factor
  );
}
