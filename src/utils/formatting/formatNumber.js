// Formats counts using the viewer's locale.
export function formatNumber(number) {
  return Number(number || 0).toLocaleString();
}
