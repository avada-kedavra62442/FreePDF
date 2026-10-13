export function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "—";
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`;
  const seconds = milliseconds / 1000;
  return seconds < 60 ? `${seconds.toFixed(seconds < 10 ? 1 : 0)} s` : `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
}
