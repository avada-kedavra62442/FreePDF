import { load } from "@wasm-zoo/ghostscript";

let gsInstance = null;

async function getGhostscript() {
  if (!gsInstance) {
    gsInstance = await load();
  }

  return gsInstance;
}

/*
 * FreePDF compression profiles
 *
 * These are APPROXIMATE targets:
 *
 * Balanced → ~25% reduction
 * Strong   → ~50% reduction
 * Maximum  → ~75% reduction
 *
 * They are not hard size guarantees because PDF size depends heavily
 * on the contents of the document.
 *
 * The profiles primarily control:
 * - image downsampling resolution
 * - JPEG quality
 * - image downsampling method
 * - color handling
 *
 * Ghostscript's pdfwrite device preserves vector/text content where
 * possible while allowing raster images to be reduced.
 */

const COMPRESSION_PROFILES = {
  balanced: {
    label: "Balanced",
    targetReduction: 25,

    args: [
      "-dCompatibilityLevel=1.4",

      "-dDownsampleColorImages=true",
      "-dDownsampleGrayImages=true",
      "-dDownsampleMonoImages=true",

      "-dColorImageResolution=150",
      "-dGrayImageResolution=150",
      "-dMonoImageResolution=300",

      "-dColorImageDownsampleType=/Bicubic",
      "-dGrayImageDownsampleType=/Bicubic",
      "-dMonoImageDownsampleType=/Subsample",

      "-dColorImageDownsampleThreshold=1.5",
      "-dGrayImageDownsampleThreshold=1.5",
      "-dMonoImageDownsampleThreshold=1.5",

      "-dAutoFilterColorImages=false",
      "-dAutoFilterGrayImages=false",

      "-dEncodeColorImages=true",
      "-dEncodeGrayImages=true",
      "-dEncodeMonoImages=true",

      "-dJPEGQ=70",

      "-dCompressPages=true",
      "-dDetectDuplicateImages=true",

      "-dFastWebView=false",
    ],
  },

  strong: {
    label: "Strong",
    targetReduction: 50,

    args: [
      "-dCompatibilityLevel=1.4",

      "-dDownsampleColorImages=true",
      "-dDownsampleGrayImages=true",
      "-dDownsampleMonoImages=true",

      "-dColorImageResolution=110",
      "-dGrayImageResolution=110",
      "-dMonoImageResolution=200",

      "-dColorImageDownsampleType=/Bicubic",
      "-dGrayImageDownsampleType=/Bicubic",
      "-dMonoImageDownsampleType=/Subsample",

      "-dColorImageDownsampleThreshold=1.25",
      "-dGrayImageDownsampleThreshold=1.25",
      "-dMonoImageDownsampleThreshold=1.25",

      "-dAutoFilterColorImages=false",
      "-dAutoFilterGrayImages=false",

      "-dEncodeColorImages=true",
      "-dEncodeGrayImages=true",
      "-dEncodeMonoImages=true",

      "-dJPEGQ=55",

      "-dCompressPages=true",
      "-dDetectDuplicateImages=true",

      "-dFastWebView=false",
    ],
  },

  maximum: {
    label: "Maximum",
    targetReduction: 75,

    args: [
      "-dCompatibilityLevel=1.4",

      "-dDownsampleColorImages=true",
      "-dDownsampleGrayImages=true",
      "-dDownsampleMonoImages=true",

      "-dColorImageResolution=72",
      "-dGrayImageResolution=72",
      "-dMonoImageResolution=150",

      "-dColorImageDownsampleType=/Bicubic",
      "-dGrayImageDownsampleType=/Bicubic",
      "-dMonoImageDownsampleType=/Subsample",

      "-dColorImageDownsampleThreshold=1.1",
      "-dGrayImageDownsampleThreshold=1.1",
      "-dMonoImageDownsampleThreshold=1.1",

      "-dAutoFilterColorImages=false",
      "-dAutoFilterGrayImages=false",

      "-dEncodeColorImages=true",
      "-dEncodeGrayImages=true",
      "-dEncodeMonoImages=true",

      "-dJPEGQ=40",

      "-dCompressPages=true",
      "-dDetectDuplicateImages=true",

      "-dFastWebView=false",
    ],
  },
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function calculateReduction(originalBytes, compressedBytes) {
  if (!originalBytes || !compressedBytes) {
    return 0;
  }

  return Math.max(
    0,
    ((originalBytes - compressedBytes) / originalBytes) * 100
  );
}

export async function compressPDF(
  pdfBytes,
  preset = "balanced",
  onProgress
) {
  if (!pdfBytes) {
    throw new Error("No PDF data was provided.");
  }

  const inputBytes =
    pdfBytes instanceof Uint8Array
      ? pdfBytes
      : new Uint8Array(pdfBytes);

  const originalSize = inputBytes.byteLength;

  const profile =
    COMPRESSION_PROFILES[preset] ||
    COMPRESSION_PROFILES.balanced;

  onProgress?.(
    `Loading compression engine…`
  );

  const gs = await getGhostscript();

  onProgress?.(
    `${profile.label} compression • target ~${profile.targetReduction}% reduction…`
  );

  const result = await gs.exec(
    [
      "-dSAFER",
      "-dBATCH",
      "-dNOPAUSE",

      ...profile.args,

      "-sDEVICE=pdfwrite",
      "-sOutputFile=/output/compressed.pdf",
      "/input/input.pdf",
    ],
    {
      files: [
        {
          name: "/input/input.pdf",
          data: inputBytes,
        },
      ],

      dirs: ["/input", "/output"],

      outputs: ["/output/compressed.pdf"],
    }
  );

  const outputFile = result.files?.find(
    (file) => file.name === "/output/compressed.pdf"
  );

  if (!outputFile?.data) {
    throw new Error(
      "Ghostscript did not produce a compressed PDF."
    );
  }

  const compressedBytes =
    outputFile.data instanceof Uint8Array
      ? outputFile.data
      : new Uint8Array(outputFile.data);

  const compressedSize = compressedBytes.byteLength;

  const reduction = calculateReduction(
    originalSize,
    compressedSize
  );

  onProgress?.(
    `Compression complete • ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} • ${reduction.toFixed(1)}% smaller`
  );

  return compressedBytes;
}
