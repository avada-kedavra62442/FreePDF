export function splitPDF(pdfBytes, groups, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/split.worker.js", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event) => {
      const { type, message, files } = event.data;

      if (type === "progress") {
        onProgress?.(message);
        return;
      }

      if (type === "complete") {
        worker.terminate();
        resolve(files);
        return;
      }

      if (type === "error") {
        worker.terminate();
        reject(new Error(message));
      }
    };

    worker.onerror = (error) => {
      worker.terminate();

      reject(
        new Error(
          error?.message ||
            "The PDF split worker failed to start."
        )
      );
    };

    worker.postMessage({
      pdfBytes: new Uint8Array(pdfBytes.slice(0)),
      groups,
    });
  });
}
