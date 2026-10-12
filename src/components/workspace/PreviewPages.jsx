import React, { useEffect, useState } from "react";
import { FileIcon } from "./icons";

export default function PreviewPages({ item }) {
  const [renderedPages, setRenderedPages] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!item?.pdf) {
        setRenderedPages([]);
        return;
      }

      const pages = [];

      try {
        const count = item.pdf.numPages;

        for (
          let pageNumber = 1;
          pageNumber <= count;
          pageNumber += 1
        ) {
          if (cancelled) return;

          const page =
            await item.pdf.getPage(
              pageNumber
            );

          const viewport =
            page.getViewport({
              scale: 0.42,
            });

          const canvas =
            document.createElement(
              "canvas"
            );

          const context =
            canvas.getContext("2d");

          canvas.width =
            Math.ceil(viewport.width);

          canvas.height =
            Math.ceil(viewport.height);

          await page
            .render({
              canvasContext: context,
              viewport,
            })
            .promise;

          pages.push({
            pageNumber,
            dataUrl:
              canvas.toDataURL(
                "image/png"
              ),
          });
        }

        if (!cancelled) {
          setRenderedPages(pages);
        }
      } catch (error) {
        console.warn(
          "[FreePDF] Preview rendering failed:",
          error
        );

        if (!cancelled) {
          setRenderedPages([]);
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [item]);

  if (!renderedPages.length) {
    return (
      <div className="freepdf-pages-grid">
        <div className="freepdf-page-card">
          <div className="freepdf-page-preview">
            <div className="freepdf-file-icon">
              <FileIcon />
            </div>
          </div>

          <div className="freepdf-page-footer">
            <span>Preview unavailable</span>
            <span className="freepdf-page-source">
              {item?.name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="freepdf-pages-grid">
      {renderedPages.map((page) => (
        <div
          className="freepdf-page-card"
          key={`${item.id}-${page.pageNumber}`}
        >
          <div className="freepdf-page-preview">
            <img
              className="freepdf-page-canvas"
              src={page.dataUrl}
              alt={`Page ${page.pageNumber} of ${item.name}`}
            />

            <div className="freepdf-page-glow" />
          </div>

          <div className="freepdf-page-footer">
            <span>
              Page {page.pageNumber}
            </span>

            <span className="freepdf-page-source">
              {item.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------
   Tool metadata
------------------------------------------------------------ */



