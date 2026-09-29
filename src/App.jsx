import React, { useRef, useState } from "react";
import "./styles.css";

const tools = [
  {
    name: "FreePDF",
    desc: "Merge, split, compress and transform PDFs.",
    icon: "PDF",
    active: true,
  },
  {
    name: "FreeImage",
    desc: "Resize, compress, convert and clean images.",
    icon: "IMG",
  },
  {
    name: "FreeConvert",
    desc: "Convert files between useful everyday formats.",
    icon: "↗",
  },
];

const faqs = [
  {
    q: "Is FreePDF actually free?",
    a: "Yes. FreePDF is designed around genuinely useful tools without subscriptions, forced accounts, watermarks or artificial daily-use limits.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. You can use the PDF workspace without creating an account. We want the tool to be useful first and ask for as little information as possible.",
  },
  {
    q: "What can I do with my PDF?",
    a: "The workspace is designed to support everyday PDF tasks such as merging, splitting, rearranging, extracting, compressing and converting pages.",
  },
  {
    q: "Are my files uploaded somewhere?",
    a: "Where a task can be performed directly in your browser, FreeToolz aims to keep that processing local. The exact processing method depends on the tool and operation.",
  },
  {
    q: "Will my PDF have a watermark?",
    a: "No. FreeToolz is not built around putting a watermark on your exported files and then asking you to pay to remove it.",
  },
  {
    q: "Will more tools be added?",
    a: "Yes. FreePDF is the first part of the wider FreeToolz ecosystem, with image, video, conversion, QR, OCR, developer and other practical tools planned.",
  },
];

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const fileInput = useRef(null);

  const addFiles = (incoming) => {
    const pdfs = Array.from(incoming || []).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    setFiles((current) => {
      const existing = new Set(
        current.map((file) => `${file.name}-${file.size}`)
      );

      return [
        ...current,
        ...pdfs.filter((file) => !existing.has(`${file.name}-${file.size}`)),
      ];
    });
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setMobileOpen(false);
    setToolsOpen(false);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      {/* NAVBAR */}
      <header className="site-header">
        <nav className="navbar glass-panel">
          <button
            className="brand"
            onClick={() => scrollTo("top")}
            aria-label="FreeToolz home"
          >
            <span className="brand-mark">
              <span className="brand-mark-inner">F</span>
            </span>

            <span className="brand-name">
              Free<span>Toolz</span>
            </span>
          </button>

          <div className={`nav-links ${mobileOpen ? "nav-open" : ""}`}>
            <div className="nav-dropdown-wrap">
              <button
                className={`nav-link tools-trigger ${
                  toolsOpen ? "active" : ""
                }`}
                onClick={() => setToolsOpen((value) => !value)}
              >
                Tools
                <span className={`chevron ${toolsOpen ? "rotated" : ""}`}>
                  ↓
                </span>
              </button>

              {toolsOpen && (
                <div className="tools-dropdown glass-panel">
                  <div className="dropdown-heading">
                    <span>EXPLORE</span>
                    <small>FreeToolz ecosystem</small>
                  </div>

                  {tools.map((tool) => (
                    <button
                      className={`dropdown-item ${
                        tool.active ? "dropdown-active" : ""
                      }`}
                      key={tool.name}
                      onClick={() => {
                        if (tool.active) scrollTo("workspace");
                      }}
                    >
                      <span className="dropdown-icon">{tool.icon}</span>
                      <span>
                        <strong>{tool.name}</strong>
                        <small>{tool.desc}</small>
                      </span>
                      <span className="dropdown-arrow">↗</span>
                    </button>
                  ))}

                  <div className="dropdown-footer">
                    More FreeToolz products are on the way.
                  </div>
                </div>
              )}
            </div>

            <button className="nav-link" onClick={() => scrollTo("how")}>
              How it works
            </button>

            <button className="nav-link" onClick={() => scrollTo("privacy")}>
              Privacy
            </button>

            <button className="nav-link" onClick={() => scrollTo("faq")}>
              FAQ
            </button>
          </div>

          <button
            className="nav-cta"
            onClick={() => scrollTo("workspace")}
          >
            <span>Open PDF</span>
            <span className="cta-arrow">↗</span>
          </button>

          <button
            className={`mobile-toggle ${mobileOpen ? "is-open" : ""}`}
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            <span />
            <span />
          </button>
        </nav>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero section">
          <div className="hero-copy reveal">
            <div className="eyebrow">
              <span className="status-dot" />
              FREE PDF TOOLS · NO NONSENSE
            </div>

            <h1>
              PDFs.
              <br />
              <span className="gradient-text">Without the nonsense.</span>
            </h1>

            <p className="hero-description">
              Merge, split, compress and transform your PDFs with a clean,
              focused workspace built to get the job done.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() => scrollTo("workspace")}
              >
                <span>Get started</span>
                <span>↗</span>
              </button>

              <button
                className="secondary-button"
                onClick={() => scrollTo("how")}
              >
                See how it works
                <span>↓</span>
              </button>
            </div>

            <div className="trust-row">
              <span>NO ACCOUNT</span>
              <i />
              <span>NO WATERMARK</span>
              <i />
              <span>NO PAYWALL</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />

            <div className="hero-glow" />

            <div className="pdf-card">
              <div className="pdf-card-top">
                <span>FREEPDF</span>
                <span className="mini-status">READY</span>
              </div>

              <div className="pdf-symbol">
                <span>PDF</span>
              </div>

              <div className="pdf-lines">
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="pdf-card-bottom">
                <span>YOUR FILE</span>
                <span>01 / 01</span>
              </div>
            </div>

            <div className="floating-chip chip-one">
              <span className="chip-icon">✓</span>
              <span>
                <strong>Private</strong>
                <small>Browser-first</small>
              </span>
            </div>

            <div className="floating-chip chip-two">
              <span className="chip-icon">↗</span>
              <span>
                <strong>Simple</strong>
                <small>No account needed</small>
              </span>
            </div>

            <div className="floating-chip chip-three">
              <span>01</span>
              <strong>DROP PDF</strong>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="marquee-wrap">
          <div className="marquee">
            <span>MERGE</span>
            <b>✦</b>
            <span>SPLIT</span>
            <b>✦</b>
            <span>COMPRESS</span>
            <b>✦</b>
            <span>CONVERT</span>
            <b>✦</b>
            <span>REARRANGE</span>
            <b>✦</b>
            <span>EXTRACT</span>
            <b>✦</b>
            <span>MERGE</span>
            <b>✦</b>
            <span>SPLIT</span>
            <b>✦</b>
            <span>COMPRESS</span>
            <b>✦</b>
            <span>CONVERT</span>
          </div>
        </div>

        {/* 02 GET STARTED */}
        <section className="workspace-section section" id="workspace">
          <div className="section-heading">
            <div>
              <span className="section-number">02</span>
              <span className="section-kicker">GET STARTED</span>
            </div>

            <h2>
              Your PDF workspace.
              <br />
              <span>Nothing in the way.</span>
            </h2>

            <p>
              Drop one or more PDF files here and start building your workflow.
              The interface stays simple so the actual work stays fast.
            </p>
          </div>

          <div
            className={`workspace glass-panel ${
              dragging ? "is-dragging" : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
          >
            <div className="workspace-topbar">
              <div className="window-controls">
                <span />
                <span />
                <span />
              </div>

              <div className="workspace-title">
                FREEPDF <span>/</span> WORKSPACE
              </div>

              <div className="workspace-status">
                <span className="status-dot" />
                READY
              </div>
            </div>

            {files.length === 0 ? (
              <div className="drop-zone">
                <div className="drop-icon">
                  <span>+</span>
                </div>

                <h3>Drop your PDF here</h3>

                <p>
                  or choose a file from your device
                </p>

                <button
                  className="upload-button"
                  onClick={() => fileInput.current?.click()}
                >
                  Choose PDF
                  <span>↗</span>
                </button>

                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  hidden
                  onChange={(event) => addFiles(event.target.files)}
                />

                <div className="drop-meta">
                  <span>PDF ONLY</span>
                  <i />
                  <span>MULTIPLE FILES</span>
                  <i />
                  <span>NO ACCOUNT</span>
                </div>
              </div>
            ) : (
              <div className="file-workspace">
                <div className="file-workspace-header">
                  <div>
                    <span className="small-label">SELECTED FILES</span>
                    <h3>
                      {files.length} PDF{files.length !== 1 ? "s" : ""} ready
                    </h3>
                  </div>

                  <button
                    className="add-more"
                    onClick={() => fileInput.current?.click()}
                  >
                    + Add more
                  </button>
                </div>

                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  hidden
                  onChange={(event) => addFiles(event.target.files)}
                />

                <div className="file-list">
                  {files.map((file, index) => (
                    <div className="file-row" key={`${file.name}-${index}`}>
                      <div className="file-number">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="file-type">PDF</div>

                      <div className="file-details">
                        <strong>{file.name}</strong>
                        <span>{formatSize(file.size)}</span>
                      </div>

                      <div className="file-ready">READY</div>

                      <button
                        className="remove-file"
                        onClick={() => removeFile(index)}
                        aria-label={`Remove ${file.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="workspace-actions">
                  <button className="workspace-main-action">
                    Choose an action
                    <span>↓</span>
                  </button>

                  <button
                    className="clear-button"
                    onClick={() => setFiles([])}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section section" id="how">
          <div className="section-heading split-heading">
            <div>
              <span className="section-number">03</span>
              <span className="section-kicker">THE EXPERIENCE</span>
            </div>

            <h2>
              Three steps.
              <br />
              <span>That's it.</span>
            </h2>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <div className="step-top">
                <span>01</span>
                <span>INPUT</span>
              </div>

              <div className="step-visual">
                <div className="mini-file">
                  <span>PDF</span>
                </div>
                <div className="mini-plus">+</div>
                <div className="mini-file ghost">
                  <span>PDF</span>
                </div>
              </div>

              <h3>Choose</h3>
              <p>
                Add the PDF files you actually need. Drag them in or select
                them from your device.
              </p>
            </article>

            <article className="step-card featured-step">
              <div className="step-top">
                <span>02</span>
                <span>PROCESS</span>
              </div>

              <div className="step-visual">
                <div className="process-ring">
                  <span>✦</span>
                </div>
              </div>

              <h3>Transform</h3>
              <p>
                Pick the operation you need and let the workspace handle the
                tedious part.
              </p>
            </article>

            <article className="step-card">
              <div className="step-top">
                <span>03</span>
                <span>OUTPUT</span>
              </div>

              <div className="step-visual">
                <div className="done-file">
                  <span>PDF</span>
                  <b>✓</b>
                </div>
              </div>

              <h3>Done</h3>
              <p>
                Get the result and move on. No maze of upgrade prompts between
                you and your file.
              </p>
            </article>
          </div>
        </section>

        {/* PRIVACY */}
        <section className="privacy-section section" id="privacy">
          <div className="privacy-card glass-panel">
            <div className="privacy-number">04</div>

            <div className="privacy-copy">
              <span className="section-kicker">PRIVACY BY DESIGN</span>

              <h2>
                Your files are
                <br />
                <span>your business.</span>
              </h2>

              <p>
                FreeToolz is designed to minimize unnecessary data collection
                and favor browser-side processing wherever the technology
                allows it.
              </p>

              <button
                className="text-button"
                onClick={() => scrollTo("faq")}
              >
                Read the FAQ
                <span>↗</span>
              </button>
            </div>

            <div className="privacy-orb">
              <div className="orb-ring ring-a" />
              <div className="orb-ring ring-b" />
              <div className="orb-core">✓</div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq-section section" id="faq">
          <div className="section-heading">
            <div>
              <span className="section-number">05</span>
              <span className="section-kicker">QUESTIONS</span>
            </div>

            <h2>
              Things worth
              <br />
              <span>knowing.</span>
            </h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <button
                  className={`faq-item ${isOpen ? "faq-open" : ""}`}
                  key={faq.q}
                  onClick={() =>
                    setOpenFaq(isOpen ? null : index)
                  }
                >
                  <span className="faq-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="faq-content">
                    <strong>{faq.q}</strong>

                    <span className="faq-answer">
                      {faq.a}
                    </span>
                  </span>

                  <span className="faq-toggle">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="final-section section">
          <div className="final-card">
            <div className="final-glow" />

            <span className="section-kicker">FREEPDF · BY FREETOOLZ</span>

            <h2>
              Just get the
              <br />
              <span>job done.</span>
            </h2>

            <p>
              No account. No watermark. No unnecessary friction.
            </p>

            <button
              className="primary-button large"
              onClick={() => scrollTo("workspace")}
            >
              <span>Open FreePDF</span>
              <span>↗</span>
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-brand-row">
              <span className="brand-mark footer-mark">
                <span className="brand-mark-inner">F</span>
              </span>

              <span className="footer-brand-name">
                Free<span>Toolz</span>
              </span>
            </div>

            <p>
              Useful software.
              <br />
              Without the nonsense.
            </p>

            <div className="footer-status">
              <span className="status-dot" />
              Building useful things
            </div>
          </div>

          <div className="footer-column">
            <span className="footer-heading">PRODUCTS</span>

            <button onClick={() => scrollTo("workspace")}>
              FreePDF
            </button>

            <button>FreeImage</button>
            <button>FreeVideo</button>
            <button>FreeConvert</button>
          </div>

          <div className="footer-column">
            <span className="footer-heading">TOOLS</span>

            <button onClick={() => scrollTo("workspace")}>
              Merge PDF
            </button>

            <button onClick={() => scrollTo("workspace")}>
              Compress PDF
            </button>

            <button onClick={() => scrollTo("workspace")}>
              Split PDF
            </button>

            <button>View all tools</button>
          </div>

          <div className="footer-column">
            <span className="footer-heading">INFORMATION</span>

            <button onClick={() => scrollTo("how")}>
              How it works
            </button>

            <button onClick={() => scrollTo("privacy")}>
              Privacy Policy
            </button>

            <button onClick={() => scrollTo("faq")}>
              FAQ
            </button>

            <a href="mailto:YOUR_EMAIL_HERE">
              Contact Developer
            </a>

            <a href="mailto:YOUR_EMAIL_HERE?subject=FreeToolz%20Feedback">
              Send Feedback
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 FreeToolz. All rights reserved.</span>

          <span className="footer-line" />

          <span>BUILT FOR THE WEB · BUILT TO BE USEFUL</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
