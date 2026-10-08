import {
  PDFDocument,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFString,
} from "pdf-lib";

/*
  FreePDF Metadata Engine

  Handles:
    - Title
    - Author
    - Subject
    - Keywords
    - Creator
    - Producer
    - Language
    - Creation Date
    - Modification Date
    - Display document title preference
    - Existing custom / Info Dictionary entries

  Important:
    PDF metadata is metadata INSIDE the PDF.

    It does not alter external filesystem timestamps,
    browser download history, cloud audit records,
    server logs, or other records outside the PDF.
*/

const STANDARD_INFO_KEYS = new Set([
  "Title",
  "Author",
  "Subject",
  "Keywords",
  "Creator",
  "Producer",
  "CreationDate",
  "ModDate",
]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseDateValue(value) {
  if (!value) return null;

  const date = value instanceof Date
    ? value
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "One of the metadata dates is invalid."
    );
  }

  return date;
}

function dateToInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value) =>
    String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

function timeToInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value) =>
    String(value).padStart(2, "0");

  return `${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function buildLocalDate(dateValue, timeValue) {
  if (!dateValue) return null;

  const time = timeValue || "00:00";

  const result = new Date(
    `${dateValue}T${time}:00`
  );

  if (Number.isNaN(result.getTime())) {
    throw new Error(
      `The date "${dateValue}" or time "${timeValue}" is invalid.`
    );
  }

  return result;
}

function safeDecodeObject(object) {
  if (!object) return "";

  try {
    if (
      object instanceof PDFHexString ||
      object instanceof PDFString
    ) {
      return object.decodeText();
    }
  } catch {
    // Fall through.
  }

  try {
    if (typeof object.toString === "function") {
      return object.toString();
    }
  } catch {
    // Ignore.
  }

  return "";
}

function getInfoDictionary(pdfDoc) {
  const infoRef = pdfDoc.context.trailerInfo?.Info;

  if (!infoRef) return null;

  try {
    return pdfDoc.context.lookup(
      infoRef,
      PDFDict
    );
  } catch {
    return null;
  }
}

function readCustomInfo(pdfDoc) {
  const info = getInfoDictionary(pdfDoc);

  if (!info) return [];

  const entries = [];

  try {
    for (const [key, value] of info.entries()) {
      const keyName =
        typeof key?.key === "string"
          ? key.key
          : String(key);

      if (STANDARD_INFO_KEYS.has(keyName)) {
        continue;
      }

      entries.push({
        id: `${keyName}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,
        key: keyName,
        value: safeDecodeObject(value),
      });
    }
  } catch (error) {
    console.warn(
      "[FreePDF] Could not inspect custom PDF metadata:",
      error
    );
  }

  return entries.sort((a, b) =>
    a.key.localeCompare(b.key)
  );
}

function getDisplayTitlePreference(pdfDoc) {
  try {
    const viewerPreferences =
      pdfDoc.catalog.getOrCreateViewerPreferences();

    const value = viewerPreferences.get(
      PDFName.of("DisplayDocTitle")
    );

    if (value && typeof value.value === "boolean") {
      return value.value;
    }

    if (
      value &&
      typeof value.asBoolean === "function"
    ) {
      return value.asBoolean();
    }
  } catch {
    // Viewer preference is optional.
  }

  return false;
}

export async function inspectPDFMetadata(bytes) {
  const pdfDoc = await PDFDocument.load(bytes, {
    updateMetadata: false,
  });

  const creationDate =
    pdfDoc.getCreationDate() || null;

  const modificationDate =
    pdfDoc.getModificationDate() || null;

  return {
    title: pdfDoc.getTitle() || "",
    author: pdfDoc.getAuthor() || "",
    subject: pdfDoc.getSubject() || "",
    keywords: pdfDoc.getKeywords() || "",
    creator: pdfDoc.getCreator() || "",
    producer: pdfDoc.getProducer() || "",
    language: "",
    creationDate,
    creationDateValue:
      dateToInputValue(creationDate),
    creationTimeValue:
      timeToInputValue(creationDate),
    modificationDate,
    modificationDateValue:
      dateToInputValue(modificationDate),
    modificationTimeValue:
      timeToInputValue(modificationDate),
    displayDocTitle:
      getDisplayTitlePreference(pdfDoc),
    customInfo: readCustomInfo(pdfDoc),
    pageCount: pdfDoc.getPageCount(),
  };
}

function setOrClearString(
  setter,
  value
) {
  const clean = cleanString(value);

  setter(clean);
}

function applyCustomInfo(pdfDoc, customInfo) {
  if (!Array.isArray(customInfo)) {
    return;
  }

  const info =
    getInfoDictionary(pdfDoc);

  if (!info) return;

  for (const entry of customInfo) {
    const key = cleanString(entry?.key);
    const value =
      typeof entry?.value === "string"
        ? entry.value
        : "";

    if (!key) continue;

    /*
      Do not allow a custom row to overwrite one
      of the standard fields. Those are handled
      through the proper PDFDocument APIs.
    */
    if (STANDARD_INFO_KEYS.has(key)) {
      continue;
    }

    const pdfKey = PDFName.of(key);

    if (value.trim()) {
      info.set(
        pdfKey,
        PDFHexString.fromText(value)
      );
    } else {
      info.delete(pdfKey);
    }
  }
}

function applyLanguage(pdfDoc, language) {
  const clean = cleanString(language);

  if (!clean) {
    try {
      pdfDoc.catalog.delete(
        PDFName.of("Lang")
      );
    } catch {
      // Nothing to remove.
    }

    return;
  }

  pdfDoc.setLanguage(clean);
}

function applyViewerTitlePreference(
  pdfDoc,
  enabled
) {
  try {
    const preferences =
      pdfDoc.catalog.getOrCreateViewerPreferences();

    preferences.setDisplayDocTitle(
      Boolean(enabled)
    );
  } catch (error) {
    console.warn(
      "[FreePDF] Could not update DisplayDocTitle:",
      error
    );
  }
}

export async function writePDFMetadata(
  bytes,
  metadata
) {
  const pdfDoc = await PDFDocument.load(bytes, {
    updateMetadata: false,
  });

  const data = metadata || {};

  setOrClearString(
    (value) =>
      pdfDoc.setTitle(value, {
        showInWindowTitleBar:
          Boolean(data.displayDocTitle),
      }),
    data.title
  );

  setOrClearString(
    (value) => pdfDoc.setAuthor(value),
    data.author
  );

  setOrClearString(
    (value) => pdfDoc.setSubject(value),
    data.subject
  );

  const keywords = cleanString(data.keywords);

  pdfDoc.setKeywords(
    keywords
      ? keywords
          .split(/[;,]/)
          .map((keyword) => keyword.trim())
          .filter(Boolean)
      : []
  );

  setOrClearString(
    (value) => pdfDoc.setCreator(value),
    data.creator
  );

  setOrClearString(
    (value) => pdfDoc.setProducer(value),
    data.producer
  );

  applyLanguage(
    pdfDoc,
    data.language
  );

  const creationDate = buildLocalDate(
    data.creationDateValue,
    data.creationTimeValue
  );

  const modificationDate = buildLocalDate(
    data.modificationDateValue,
    data.modificationTimeValue
  );

  if (creationDate) {
    pdfDoc.setCreationDate(
      creationDate
    );
  }

  if (modificationDate) {
    pdfDoc.setModificationDate(
      modificationDate
    );
  }

  applyViewerTitlePreference(
    pdfDoc,
    data.displayDocTitle
  );

  applyCustomInfo(
    pdfDoc,
    data.customInfo
  );

  return pdfDoc.save({
    useObjectStreams: true,
  });
}

export function createEmptyCustomInfoRow() {
  return {
    id: `custom-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    key: "",
    value: "",
  };
}

export function formatMetadataDate(date) {
  if (!(date instanceof Date)) {
    return "Not set";
  }

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "medium",
    }
  ).format(date);
}
