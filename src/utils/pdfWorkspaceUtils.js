// Backwards-compatible utility barrel.
// Existing imports can keep using this module while implementation stays organized.
export { makeId } from "./identity/makeId.js";
export { formatBytes } from "./formatting/formatBytes.js";
export { formatNumber } from "./formatting/formatNumber.js";
export { stripPdfExtension } from "./formatting/stripPdfExtension.js";
export { navigate } from "../lib/navigationAction.js";
