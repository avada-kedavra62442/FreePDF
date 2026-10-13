export function isPageNumberInRange(page, totalPages) {
  return Number.isSafeInteger(page) && Number.isSafeInteger(totalPages) && page >= 1 && page <= totalPages;
}
