export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  return typeof error?.message === "string" && error.message.trim() ? error.message.trim() : fallback;
}
