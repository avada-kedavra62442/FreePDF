import { load } from "@wasm-zoo/ghostscript";

let gsInstance = null;

async function getGhostscript() {
  if (!gsInstance) {
    gsInstance = await load();
  }

  return gsInstance;
}

self.onmessage = async (event) => {
  const { pdfBytes, preset } = event.data;

  try {
    if (!pdfBytes) {
      throw new Error("No PDF data was provided.");
    }

    self.postMessage({
      type: "progress",
      stage: "loading",
      message: "Loading compression engine…",
    });

    const gs = await getGhostscript();

    self.postMessage({
      type: "progress",
      stage: "processing",
      message: "Compressing PDF…",
    });

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

    const selectedPreset = presets[preset] || presets.balanced;

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
            data: new Uint8Array(pdfBytes),
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
      throw new Error("Ghostscript did not produce a compressed PDF.");
    }

    self.postMessage(
      {
        type: "complete",
        bytes: outputFile.data,
      },
      [outputFile.data.buffer]
    );
  } catch (error) {
    self.postMessage({
      type: "error",
      message:
        error?.message ||
        "PDF compression failed. Please try another PDF or compression level.",
    });
  }
};
