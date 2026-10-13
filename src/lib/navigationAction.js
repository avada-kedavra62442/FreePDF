// Client-side navigation used by the single-page application.
export function navigate(path) {
  if (typeof path !== "string" || !path.startsWith("/")) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
