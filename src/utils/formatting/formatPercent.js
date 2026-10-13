export function formatPercent(value, fractionDigits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${(number * 100).toFixed(Math.max(0, Math.min(4, fractionDigits)))}%`;
}
