import React from "react";
import { TOOLS } from "../../data/toolData";
import { TOOL_ROUTES } from "../../config/routes";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import PDFWorkspace from "../../PDFWorkspace";

export default function ToolPage({
  mode,
}) {
  const tool =
    TOOLS.find(
      (item) =>
        item.path ===
        TOOL_ROUTES[mode]
    );

  const titleMap = {
    workspace:
      "Choose your PDF tool.",
    merge:
      "Merge your PDFs.",
    split:
      "Split your PDF.",
    compress:
      "Compress your PDF.",
    "pdf-to-image":
      "Turn PDF pages into images.",
    "image-to-pdf":
      "Turn images into a PDF.",
    sign:
      "Sign your PDF.",
    "password-protect":
      "Protect your PDF.",
    metadata:
      "Edit your PDF metadata.",
  };

  const title =
    titleMap[mode] ||
    "Choose your PDF tool.";

  const eyebrow =
    mode === "workspace"
      ? "FREEPDF WORKSPACE"
      : tool
      ? tool.name.toUpperCase()
      : "FREEPDF";

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <Header page="tool" />

      <main id="top">
        <section
          className="section"
          style={{
            paddingTop: 150,
            paddingBottom: 55,
          }}
        >
          <div
            className="section-heading"
            style={{
              maxWidth: 1160,
              margin: "0 auto",
            }}
          >
            <div>
              <span className="section-number">
                02
              </span>

              <span className="section-kicker">
                {eyebrow}
              </span>
            </div>

            <h2>
              {title}
            </h2>
          </div>

          {mode !== "workspace" &&
            tool && (
              <p
                style={{
                  maxWidth: 760,
                  margin:
                    "18px auto 0",
                  padding:
                    "0 24px",
                  opacity: 0.72,
                  lineHeight: 1.7,
                  textAlign: "center",
                }}
              >
                {tool.description}
              </p>
            )}
        </section>

        <PDFWorkspace mode={mode} />
      </main>

      <Footer />
    </div>
  );
}
