export function scrollToElement(element, options = {}) {
  if (!element || typeof element.scrollIntoView !== "function") return false;
  element.scrollIntoView({ behavior: "smooth", block: "center", ...options });
  return true;
}
