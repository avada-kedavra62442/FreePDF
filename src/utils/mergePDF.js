export function mergePDF(pdfFiles, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/merge.worker.js", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event) => {
      const { type, message, bytes } = event.data;

      if (type === "progress") {
        onProgress?.(message);
        return;
      }

      if (type === "complete") {
        worker.terminate();
        resolve(bytes);
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
            "The PDF merge worker failed to start."
        )
      );
    };

    worker.postMessage({
      pdfFiles: pdfFiles.map((file) => ({
        name: file.name,
        bytes: new Uint8Array(file.buffer.slice(0)),
      })),
    });
  });
}
