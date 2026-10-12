export function parsePageRanges(input, totalPages) {
  const raw = String(input ?? "");

  if (!raw.trim()) {
    return {
      pages: null,
      groups: null,
      error:
        "Enter at least one page or page range, for example 1-3, 5-6.",
    };
  }

  const parts = raw.split(",");

  if (parts.some((part) => !part.trim())) {
    return {
      pages: null,
      groups: null,
      error:
        "There is an empty section in your input. Separate sections with commas, for example 1-3, 5-6.",
    };
  }

  const groups = [];
  const pages = [];
  const seen = new Set();

  for (const rawPart of parts) {
    const part = rawPart.trim();

    if (/^\d+$/.test(part)) {
      const page = Number(part);

      if (!Number.isSafeInteger(page) || page < 1) {
        return {
          pages: null,
          groups: null,
          error: "Page numbers start at 1 and must be valid numbers.",
        };
      }

      if (page > totalPages) {
        return {
          pages: null,
          groups: null,
          error: `Page ${page} is outside this PDF. This PDF contains ${totalPages} ${
            totalPages === 1 ? "page" : "pages"
          }.`,
        };
      }

      if (seen.has(page)) {
        return {
          pages: null,
          groups: null,
          error: `Page ${page} appears more than once. Remove duplicate or overlapping sections.`,
        };
      }

      seen.add(page);
      pages.push(page);

      groups.push({
        start: page,
        end: page,
        pages: [page],
      });

      continue;
    }

    const match = part.match(/^(\d+)\s*-\s*(\d+)$/);

    if (!match) {
      return {
        pages: null,
        groups: null,
        error: `"${part}" isn't a valid section. Use formats such as 3, 2-6, or 1-3, 5-7.`,
      };
    }

    const start = Number(match[1]);
    const end = Number(match[2]);

    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 1 ||
      end < 1
    ) {
      return {
        pages: null,
        groups: null,
        error: `Range "${part}" contains an invalid page number.`,
      };
    }

    if (start > end) {
      return {
        pages: null,
        groups: null,
        error: `Range "${part}" is backwards. Use ${end}-${start} if that is what you intended.`,
      };
    }

    if (start > totalPages || end > totalPages) {
      return {
        pages: null,
        groups: null,
        error: `Range "${part}" is outside this PDF. It contains ${totalPages} ${
          totalPages === 1 ? "page" : "pages"
        }.`,
      };
    }

    const groupPages = [];

    for (let page = start; page <= end; page += 1) {
      if (seen.has(page)) {
        return {
          pages: null,
          groups: null,
          error: `Page ${page} is included more than once because your sections overlap or duplicate an earlier page.`,
        };
      }

      seen.add(page);
      pages.push(page);
      groupPages.push(page);
    }

    groups.push({
      start,
      end,
      pages: groupPages,
    });
  }

  return {
    pages,
    groups,
    error: "",
  };
}

/* ------------------------------------------------------------
   Preview
------------------------------------------------------------ */
