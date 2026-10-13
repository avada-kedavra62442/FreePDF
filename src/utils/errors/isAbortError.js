export function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === "ABORT_ERR";
}
