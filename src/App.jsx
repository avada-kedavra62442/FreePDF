import React, { useEffect, useState } from "react";
import {
  FaGithub,
  FaEnvelope,
  FaLinkedin,
} from "react-icons/fa";

import "./styles.css";
import PDFWorkspace from "./PDFWorkspace";

/* ------------------------------------------------------------
   Routing
------------------------------------------------------------ */

const TOOL_ROUTES = {
  workspace: "/workspace",
  merge: "/merge",
  split: "/split",
  compress: "/compress",
  "pdf-to-image": "/pdf-to-image",
  "image-to-pdf": "/image-to-pdf",
  rearrange: "/rearrange",
  "delete-pages": "/delete-pages",
  extract: "/extract",
  rotate: "/rotate",
  "page-numbers": "/page-numbers",
  watermark: "/watermark",
  "remove-watermark": "/remove-watermark",
  sign: "/sign",
  "fill-forms": "/fill-forms",
  "password-protect": "/password-protect",
  metadata: "/metadata",
};

const ROUTE_TO_MODE = Object.fromEntries(
  Object.entries(TOOL_ROUTES).map(
    ([mode, path]) => [path, mode]
  )
);

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(
    new PopStateEvent("popstate")
  );
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* ------------------------------------------------------------
   Homepage data
------------------------------------------------------------ */

const tools = [
  {
    name: "FreePDF",
    desc: "All FreePDF tools",
    icon: "PDF",
    path: "/workspace",
    active: true,
  },
  {
    name: "Merge PDF",
    desc: "Combine multiple PDFs",
    icon: "+",
    path: "/merge",
    active: true,
  },
  {
    name: "Compress PDF",
    desc: "Reduce PDF size",
    icon: "↓",
    path: "/compress",
    active: true,
  },
  {
    name: "Split PDF",
    desc: "Separate PDF pages",
    icon: "÷",
    path: "/split",
    active: true,
  },
];

const faqs = [
  {
    q: "Is FreePDF actually free?",
    a: "Yes. FreePDF is designed around genuinely useful tools without subscriptions, forced accounts, watermarks or artificial daily-use limits.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. You can use FreePDF without creating an account. We want the tool to be useful first and ask for as little information as possible.",
  },
  {
    q: "What can I do with my PDF?",
    a: "FreePDF is being built as a collection of focused tools for merging, splitting, compressing, converting, rearranging, extracting and editing PDFs.",
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

/* ------------------------------------------------------------
   Tool page shell
------------------------------------------------------------ */

function ToolPage({ mode }) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const title =
    mode === "workspace"
      ? "FreePDF Workspace"
      : mode === "merge"
      ? "Merge PDF"
      : mode === "split"
      ? "Split PDF"
      : mode === "compress"
      ? "Compress PDF"
      : "FreePDF Tool";

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <header className="site-header">
        <nav className="navbar glass-panel">

          <button
            className="brand"
            onClick={() => navigate("/")}
            aria-label="FreeToolz home"
          >
            <span className="brand-mark">
              <span className="brand-mark-inner">
                F
              </span>
            </span>

            <span className="brand-name">
              Free<span>Toolz</span>
            </span>
          </button>

          <div
            className={`nav-links ${
              mobileOpen
                ? "nav-open"
                : ""
            }`}
          >
            <button
              className="nav-link"
              onClick={() =>
                navigate("/workspace")
              }
            >
              All PDF Tools
            </button>

            <button
              className="nav-link"
              onClick={() =>
                navigate("/merge")
              }
            >
              Merge
            </button>

            <button
              className="nav-link"
              onClick={() =>
                navigate("/compress")
              }
            >
              Compress
            </button>

            <button
              className="nav-link"
              onClick={() =>
                navigate("/split")
              }
            >
              Split
            </button>
          </div>

          <button
            className="nav-cta"
            onClick={() =>
              navigate("/workspace")
            }
          >
            <span>All Tools</span>
            <span className="cta-arrow">
              ↗
            </span>
          </button>

          <button
            className={`mobile-toggle ${
              mobileOpen
                ? "is-open"
                : ""
            }`}
            onClick={() =>
              setMobileOpen(
                (value) => !value
              )
            }
            aria-label="Toggle navigation"
          >
            <span />
            <span />
          </button>
        </nav>
      </header>

      <main id="top">
        <section
          className="section"
          style={{
            paddingTop: 150,
            paddingBottom: 80,
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
                {title}
              </span>
            </div>

            <h2>
              {mode ===
              "workspace"
                ? "Choose your PDF tool."
                : `Get the ${title.toLowerCase()} job done.`}
            </h2>
          </div>
        </section>

        <PDFWorkspace mode={mode} />
      </main>

      <footer
        className="site-footer"
        style={{
          marginTop: 80,
        }}
      >
        <div className="footer-main">

          <div className="footer-brand">
            <div className="footer-brand-row">
              <span className="brand-mark footer-mark">
                <span className="brand-mark-inner">
                  F
                </span>
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

            <div className="footer-socials">
              <a
                href="https://github.com/avada-kedavra62442/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="GitHub"
                title="GitHub"
              >
                <FaGithub size={18} />
              </a>

              <a
                href="mailto:aarav.krish62442@gmail.com"
                className="footer-social-link"
                aria-label="Email"
                title="Email"
              >
                <FaEnvelope size={18} />
              </a>

              <a
                href="https://www.linkedin.com/in/aarav-krish-665702440/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <FaLinkedin size={18} />
              </a>
            </div>
          </div>

          <div className="footer-column">
            <span className="footer-heading">
              PRODUCTS
            </span>

            <button
              onClick={() =>
                navigate("/workspace")
              }
            >
              FreePDF
            </button>

            <button
              onClick={() =>
                navigate("/workspace")
              }
            >
              View all PDF tools
            </button>
          </div>

          <div className="footer-column">
            <span className="footer-heading">
              TOOLS
            </span>

            <button
              onClick={() =>
                navigate("/merge")
              }
            >
              Merge PDF
            </button>

            <button
              onClick={() =>
                navigate("/compress")
              }
            >
              Compress PDF
            </button>

            <button
              onClick={() =>
                navigate("/split")
              }
            >
              Split PDF
            </button>

            <button
              onClick={() =>
                navigate("/extract")
              }
            >
              Extract pages
            </button>

            <button
              onClick={() =>
                navigate("/rearrange")
              }
            >
              Rearrange pages
            </button>
          </div>

          <div className="footer-column">
            <span className="footer-heading">
              INFORMATION
            </span>

            <button
              onClick={() =>
                navigate("/")
              }
            >
              FreePDF Home
            </button>

            <button
              onClick={() =>
                navigate("/workspace")
              }
            >
              All Tools
            </button>

            <a href="mailto:aarav.krish62442@gmail.com">
              Contact Developer
            </a>

            <a href="mailto:aarav.krish62442@gmail.com?subject=FreeToolz%20Feedback">
              Send Feedback
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © 2026 FreeToolz. All rights reserved.
          </span>

          <span className="footer-line" />

          <span>
            BUILT FOR THE WEB · BUILT TO BE USEFUL
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------
   Homepage
------------------------------------------------------------ */

function HomePage() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [toolsOpen, setToolsOpen] =
    useState(false);

  const [openFaq, setOpenFaq] =
    useState(null);

  const scrollTo = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

    setMobileOpen(false);
    setToolsOpen(false);
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
            onClick={() =>
              scrollTo("top")
            }
            aria-label="FreeToolz home"
          >
            <span className="brand-mark">
              <span className="brand-mark-inner">
                F
              </span>
            </span>

            <span className="brand-name">
              Free<span>Toolz</span>
            </span>
          </button>

          <div
            className={`nav-links ${
              mobileOpen
                ? "nav-open"
                : ""
            }`}
          >
            <div className="nav-dropdown-wrap">
              <button
                className={`nav-link tools-trigger ${
                  toolsOpen
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setToolsOpen(
                    (value) => !value
                  )
                }
              >
                Tools

                <span
                  className={`chevron ${
                    toolsOpen
                      ? "rotated"
                      : ""
                  }`}
                >
                  ↓
                </span>
              </button>

              {toolsOpen && (
                <div className="tools-dropdown glass-panel">
                  <div className="dropdown-heading">
                    <span>
                      EXPLORE
                    </span>

                    <small>
                      FreePDF tools
                    </small>
                  </div>

                  {tools.map(
                    (tool) => (
                      <button
                        className={`dropdown-item ${
                          tool.active
                            ? "dropdown-active"
                            : ""
                        }`}
                        key={tool.name}
                        onClick={() =>
                          navigate(
                            tool.path
                          )
                        }
                      >
                        <span className="dropdown-icon">
                          {tool.icon}
                        </span>

                        <span>
                          <strong>
                            {tool.name}
                          </strong>

                          <small>
                            {tool.desc}
                          </small>
                        </span>

                        <span className="dropdown-arrow">
                          ↗
                        </span>
                      </button>
                    )
                  )}

                  <div className="dropdown-footer">
                    More FreePDF tools are on the way.
                  </div>
                </div>
              )}
            </div>

            <button
              className="nav-link"
              onClick={() =>
                scrollTo("how")
              }
            >
              How it works
            </button>

            <button
              className="nav-link"
              onClick={() =>
                scrollTo("privacy")
              }
            >
              Privacy
            </button>

            <button
              className="nav-link"
              onClick={() =>
                scrollTo("faq")
              }
            >
              FAQ
            </button>
          </div>

          <button
            className="nav-cta"
            onClick={() =>
              navigate("/workspace")
            }
          >
            <span>
              Open PDF
            </span>

            <span className="cta-arrow">
              ↗
            </span>
          </button>

          <button
            className={`mobile-toggle ${
              mobileOpen
                ? "is-open"
                : ""
            }`}
            onClick={() =>
              setMobileOpen(
                (value) => !value
              )
            }
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
              <span className="gradient-text">
                Without the nonsense.
              </span>
            </h1>

            <p className="hero-description">
              Merge, split, compress and transform
              your PDFs with a clean, focused
              workspace built to get the job done.
            </p>

            <div className="hero-actions">

              <button
                className="primary-button"
                onClick={() =>
                  navigate("/workspace")
                }
              >
                <span>
                  Get started
                </span>

                <span>
                  ↗
                </span>
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  scrollTo("how")
                }
              >
                See how it works
                <span>
                  ↓
                </span>
              </button>

            </div>

            <div className="trust-row">
              <span>
                NO ACCOUNT
              </span>

              <i />

              <span>
                NO WATERMARK
              </span>

              <i />

              <span>
                NO PAYWALL
              </span>
            </div>
          </div>

          <div className="hero-visual">

            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />

            <div className="hero-glow" />

            <div className="pdf-card">
              <div className="pdf-card-top">
                <span>
                  FREEPDF
                </span>

                <span className="mini-status">
                  READY
                </span>
              </div>

              <div className="pdf-symbol">
                <span>
                  PDF
                </span>
              </div>

              <div className="pdf-lines">
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="pdf-card-bottom">
                <span>
                  YOUR FILE
                </span>

                <span>
                  01 / 01
                </span>
              </div>
            </div>

            <div className="floating-chip chip-one">
              <span className="chip-icon">
                ✓
              </span>

              <span>
                <strong>
                  Private
                </strong>

                <small>
                  Browser-first
                </small>
              </span>
            </div>

            <div className="floating-chip chip-two">
              <span className="chip-icon">
                ↗
              </span>

              <span>
                <strong>
                  Simple
                </strong>

                <small>
                  No account needed
                </small>
              </span>
            </div>

            <div className="floating-chip chip-three">
              <span>
                01
              </span>

              <strong>
                DROP PDF
              </strong>
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

        {/* HOW IT WORKS */}

        <section
          className="how-section section"
          id="how"
        >
          <div className="section-heading split-heading">
            <div>
              <span className="section-number">
                02
              </span>

              <span className="section-kicker">
                THE EXPERIENCE
              </span>
            </div>

            <h2>
              Three steps.
              <br />
              <span>
                That's it.
              </span>
            </h2>
          </div>

          <div className="steps-grid">

            <article className="step-card">
              <div className="step-top">
                <span>
                  01
                </span>

                <span>
                  INPUT
                </span>
              </div>

              <div className="step-visual">
                <div className="mini-file">
                  <span>
                    PDF
                  </span>
                </div>

                <div className="mini-plus">
                  +
                </div>

                <div className="mini-file ghost">
                  <span>
                    PDF
                  </span>
                </div>
              </div>

              <h3>
                Choose
              </h3>

              <p>
                Add the PDF files you actually
                need. Drag them in or select them
                from your device.
              </p>
            </article>

            <article className="step-card featured-step">
              <div className="step-top">
                <span>
                  02
                </span>

                <span>
                  PROCESS
                </span>
              </div>

              <div className="step-visual">
                <div className="process-ring">
                  <span>
                    ✦
                  </span>
                </div>
              </div>

              <h3>
                Transform
              </h3>

              <p>
                Pick the operation you need and let
                the dedicated tool handle the tedious
                part.
              </p>
            </article>

            <article className="step-card">
              <div className="step-top">
                <span>
                  03
                </span>

                <span>
                  OUTPUT
                </span>
              </div>

              <div className="step-visual">
                <div className="done-file">
                  <span>
                    PDF
                  </span>

                  <b>
                    ✓
                  </b>
                </div>
              </div>

              <h3>
                Done
              </h3>

              <p>
                Get the result and move on. No maze
                of upgrade prompts between you and
                your file.
              </p>
            </article>

          </div>
        </section>

        {/* PRIVACY */}

        <section
          className="privacy-section section"
          id="privacy"
        >
          <div className="privacy-card glass-panel">

            <div className="privacy-number">
              03
            </div>

            <div className="privacy-copy">
              <span className="section-kicker">
                PRIVACY BY DESIGN
              </span>

              <h2>
                Your files are
                <br />
                <span>
                  your business.
                </span>
              </h2>

              <p>
                FreeToolz is designed to minimize
                unnecessary data collection and favor
                browser-side processing wherever the
                technology allows it.
              </p>

              <button
                className="text-button"
                onClick={() =>
                  scrollTo("faq")
                }
              >
                Read the FAQ
                <span>
                  ↗
                </span>
              </button>
            </div>

            <div className="privacy-orb">
              <div className="orb-ring ring-a" />
              <div className="orb-ring ring-b" />
              <div className="orb-core">
                ✓
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}

        <section
          className="faq-section section"
          id="faq"
        >
          <div className="section-heading">

            <div>
              <span className="section-number">
                04
              </span>

              <span className="section-kicker">
                QUESTIONS
              </span>
            </div>

            <h2>
              Things worth
              <br />
              <span>
                knowing.
              </span>
            </h2>
          </div>

          <div className="faq-list">
            {faqs.map(
              (faq, index) => {
                const isOpen =
                  openFaq === index;

                return (
                  <button
                    className={`faq-item ${
                      isOpen
                        ? "faq-open"
                        : ""
                    }`}
                    key={faq.q}
                    onClick={() =>
                      setOpenFaq(
                        isOpen
                          ? null
                          : index
                      )
                    }
                  >
                    <span className="faq-index">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <span className="faq-content">
                      <strong>
                        {faq.q}
                      </strong>

                      <span className="faq-answer">
                        {faq.a}
                      </span>
                    </span>

                    <span className="faq-toggle">
                      {isOpen
                        ? "−"
                        : "+"}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* FINAL CTA */}

        <section className="final-section section">
          <div className="final-card">
            <div className="final-glow" />

            <span className="section-kicker">
              FREEPDF · BY FREETOOLZ
            </span>

            <h2>
              Just get the
              <br />
              <span>
                job done.
              </span>
            </h2>

            <p>
              No account. No watermark.
              No unnecessary friction.
            </p>

            <button
              className="primary-button large"
              onClick={() =>
                navigate(
                  "/workspace"
                )
              }
            >
              <span>
                Open FreePDF
              </span>

              <span>
                ↗
              </span>
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
                <span className="brand-mark-inner">
                  F
                </span>
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

            <div className="footer-socials">

              <a
                href="https://github.com/avada-kedavra62442/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="GitHub"
                title="GitHub"
              >
                <FaGithub size={18} />
              </a>

              <a
                href="mailto:aarav.krish62442@gmail.com"
                className="footer-social-link"
                aria-label="Email"
                title="Email"
              >
                <FaEnvelope size={18} />
              </a>

              <a
                href="https://www.linkedin.com/in/aarav-krish-665702440/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <FaLinkedin size={18} />
              </a>

            </div>
          </div>

          <div className="footer-column">
            <span className="footer-heading">
              PRODUCTS
            </span>

            <button
              onClick={() =>
                navigate(
                  "/workspace"
                )
              }
            >
              FreePDF
            </button>

            <button
              onClick={() =>
                navigate(
                  "/workspace"
                )
              }
            >
              All PDF Tools
            </button>

            <button
              onClick={() =>
                navigate(
                  "/compress"
                )
              }
            >
              Compress PDF
            </button>

            <button
              onClick={() =>
                navigate(
                  "/merge"
                )
              }
            >
              Merge PDF
            </button>
          </div>

          <div className="footer-column">
            <span className="footer-heading">
              TOOLS
            </span>

            <button
              onClick={() =>
                navigate(
                  "/merge"
                )
              }
            >
              Merge PDF
            </button>

            <button
              onClick={() =>
                navigate(
                  "/compress"
                )
              }
            >
              Compress PDF
            </button>

            <button
              onClick={() =>
                navigate(
                  "/split"
                )
              }
            >
              Split PDF
            </button>

            <button
              onClick={() =>
                navigate(
                  "/extract"
                )
              }
            >
              Extract Pages
            </button>

            <button
              onClick={() =>
                navigate(
                  "/rearrange"
                )
              }
            >
              Rearrange Pages
            </button>

            <button
              onClick={() =>
                navigate(
                  "/delete-pages"
                )
              }
            >
              Delete Pages
            </button>

          </div>

          <div className="footer-column">
            <span className="footer-heading">
              INFORMATION
            </span>

            <button
              onClick={() =>
                scrollTo("how")
              }
            >
              How it works
            </button>

            <button
              onClick={() =>
                scrollTo("privacy")
              }
            >
              Privacy Policy
            </button>

            <button
              onClick={() =>
                scrollTo("faq")
              }
            >
              FAQ
            </button>

            <a href="mailto:aarav.krish62442@gmail.com">
              Contact Developer
            </a>

            <a href="mailto:aarav.krish62442@gmail.com?subject=FreeToolz%20Feedback">
              Send Feedback
            </a>
          </div>

        </div>

        <div className="footer-bottom">
          <span>
            © 2026 FreeToolz. All rights reserved.
          </span>

          <span className="footer-line" />

          <span>
            BUILT FOR THE WEB · BUILT TO BE USEFUL
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------
   App
------------------------------------------------------------ */

export default function App() {
  const [path, setPath] =
    useState(
      window.location.pathname
    );

  useEffect(() => {
    const handlePopState = () => {
      setPath(
        window.location.pathname
      );

      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  const mode =
    ROUTE_TO_MODE[path];

  if (mode) {
    return (
      <ToolPage mode={mode} />
    );
  }

  return <HomePage />;
}
