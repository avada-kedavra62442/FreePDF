import { load } from "@wasm-zoo/ghostscript";

let gsInstance = null;

async function getGhostscript() {
  if (!gsInstance) {
    gsInstance = await load();
  }

  return gsInstance;
}

export async function compressPDF(
  pdfBytes,
  preset = "balanced",
  onProgress
) {
  if (!pdfBytes) {
    throw new Error("No PDF data was provided.");
  }

  onProgress?.("Loading compression engine…");

  const gs = await getGhostscript();

  onProgress?.("Compressing PDF…");

  const presets = {
    balanced: [
      "-dPDFSETTINGS=/ebook",
      "-dCompatibilityLevel=1.4",
    ],

    strong: [
      "-dPDFSETTINGS=/screen",
      "-dCompatibilityLevel=1.4",
    ],

    maximum: [
      "-dPDFSETTINGS=/screen",
      "-dCompatibilityLevel=1.3",
    ],
  };

  const selectedPreset =
    presets[preset] || presets.balanced;

  const inputBytes =
    pdfBytes instanceof Uint8Array
      ? pdfBytes
      : new Uint8Array(pdfBytes);

  const result = await gs.exec(
    [
      "-dSAFER",
      "-dBATCH",
      "-dNOPAUSE",
      ...selectedPreset,
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

  onProgress?.("Compression complete.");

  return outputFile.data instanceof Uint8Array
    ? outputFile.data
    : new Uint8Array(outputFile.data);
}
