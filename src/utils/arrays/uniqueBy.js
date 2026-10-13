export function uniqueBy(items, getKey) {
  const seen = new Set();
  return Array.from(items || []).filter((item, index) => {
    const key = typeof getKey === "function" ? getKey(item, index) : item?.[getKey];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
