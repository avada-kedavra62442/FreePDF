import React, { useEffect, useState } from "react";
import {
  FaGithub,
  FaEnvelope,
  FaLinkedin,
} from "react-icons/fa";

import "./styles.css";
import PDFWorkspace from "./PDFWorkspace";

/* ============================================================
   FREEPDF ROUTING
   ============================================================ */

const TOOL_ROUTES = {
  workspace: "/workspace",
  merge: "/merge",
  split: "/split",
  compress: "/compress",
  "pdf-to-image": "/pdf-to-image",
  "image-to-pdf": "/image-to-pdf",
  rearrange: "/rearrange",
  "delete-pages": "/delete-pages",
  sign: "/sign",
  "fill-forms": "/fill-forms",
  "password-protect": "/password-protect",
  metadata: "/metadata",
};

const ROUTE_TO_MODE = Object.fromEntries(
  Object.entries(TOOL_ROUTES).map(([mode, path]) => [
    path,
    mode,
  ])
);

const VALID_MODES = new Set(
  Object.keys(TOOL_ROUTES)
);

function navigate(path) {
  if (!path) return;

  if (window.location.pathname === path) {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    return;
  }

  window.history.pushState({}, "", path);

  window.dispatchEvent(
    new PopStateEvent("popstate")
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* ============================================================
   TOOL DATA
   ============================================================ */

const TOOLS = [
  {
    name: "Merge PDF",
    description: "Combine multiple PDFs into one file.",
    icon: "+",
    path: "/merge",
  },
  {
    name: "Split PDF",
    description: "Separate pages or custom page ranges.",
    icon: "÷",
    path: "/split",
  },
  {
    name: "Compress PDF",
    description: "Reduce your PDF file size.",
    icon: "↓",
    path: "/compress",
  },
  {
    name: "PDF → Image",
    description: "Turn PDF pages into JPG or PNG images.",
    icon: "▣",
    path: "/pdf-to-image",
  },
  {
    name: "Image → PDF",
    description: "Combine JPG or PNG images into a PDF.",
    icon: "◈",
    path: "/image-to-pdf",
  },
  {
    name: "Rearrange Pages",
    description: "Put your PDF pages in the right order.",
    icon: "↕",
    path: "/rearrange",
  },
  {
    name: "Delete Pages",
    description: "Remove pages you no longer need.",
    icon: "−",
    path: "/delete-pages",
  },
  {
    name: "Sign PDF",
    description: "Add your signature to a PDF.",
    icon: "✎",
    path: "/sign",
  },
  {
    name: "Fill PDF Forms",
    description: "Fill out supported PDF form fields.",
    icon: "□",
    path: "/fill-forms",
  },
  {
    name: "Password Protect",
    description: "Protect your PDF before sharing it.",
    icon: "◇",
    path: "/password-protect",
  },
  {
    name: "PDF Metadata",
    description: "Edit title, author, subject and keywords.",
    icon: "i",
    path: "/metadata",
  },
];

const FAQS = [
  {
    question: "Is FreePDF actually free?",
    answer:
      "Yes. FreePDF is built around useful PDF tools without subscriptions, forced accounts, artificial daily limits or paid feature walls.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. FreePDF is designed to work without an account. Open a tool, add your file and get to work.",
  },
  {
    question: "What can I do with FreePDF?",
    answer:
      "FreePDF is being built as a focused collection of tools for merging, splitting, compressing, converting, rearranging, editing and managing PDFs.",
  },
  {
    question: "Are my files uploaded somewhere?",
    answer:
      "Where a task can be performed directly in your browser, FreePDF processes it locally. The exact processing method depends on the tool and operation.",
  },
  {
    question: "Will FreePDF add a watermark to my files?",
    answer:
      "No. FreePDF is not built around adding a watermark to your exported files and then asking you to pay to remove it.",
  },
  {
    question: "Will more tools be added?",
    answer:
      "Yes. FreePDF is the first part of the wider FreeToolz project, with more practical tools planned over time.",
  },
];

/* ============================================================
   SHARED HEADER
   ============================================================ */

function Header({
  page = "home",
}) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [toolsOpen, setToolsOpen] =
    useState(false);

  const closeMenus = () => {
    setMobileOpen(false);
    setToolsOpen(false);
  };

  const go = (path) => {
    closeMenus();
    navigate(path);
  };

  const scrollTo = (id) => {
    closeMenus();

    if (
      window.location.pathname !== "/"
    ) {
      navigate("/");
      setTimeout(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 80);
      return;
    }

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <header className="site-header">
      <nav className="navbar glass-panel">
        <button
          className="brand"
          onClick={() => go("/")}
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
            mobileOpen ? "nav-open" : ""
          }`}
        >
          {page === "home" ? (
            <>
              <div className="nav-dropdown-wrap">
                <button
                  className={`nav-link tools-trigger ${
                    toolsOpen ? "active" : ""
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
                      toolsOpen ? "rotated" : ""
                    }`}
                  >
                    ↓
                  </span>
                </button>

                {toolsOpen && (
                  <div className="tools-dropdown glass-panel">
                    <div className="dropdown-heading">
                      <span>EXPLORE</span>
                      <small>
                        FreePDF tools
                      </small>
                    </div>

                    {TOOLS.slice(0, 6).map(
                      (tool) => (
                        <button
                          key={tool.path}
                          className="dropdown-item dropdown-active"
                          onClick={() =>
                            go(tool.path)
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
                              {tool.description}
                            </small>
                          </span>

                          <span className="dropdown-arrow">
                            ↗
                          </span>
                        </button>
                      )
                    )}

                    <button
                      className="dropdown-item dropdown-active"
                      onClick={() =>
                        go("/workspace")
                      }
                    >
                      <span className="dropdown-icon">
                        PDF
                      </span>

                      <span>
                        <strong>
                          View all tools
                        </strong>

                        <small>
                          Explore the complete FreePDF workspace.
                        </small>
                      </span>

                      <span className="dropdown-arrow">
                        ↗
                      </span>
                    </button>
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
            </>
          ) : (
            <>
              <button
                className="nav-link"
                onClick={() =>
                  go("/workspace")
                }
              >
                All PDF Tools
              </button>

              <button
                className="nav-link"
                onClick={() =>
                  go("/merge")
                }
              >
                Merge
              </button>

              <button
                className="nav-link"
                onClick={() =>
                  go("/compress")
                }
              >
                Compress
              </button>

              <button
                className="nav-link"
                onClick={() =>
                  go("/split")
                }
              >
                Split
              </button>
            </>
          )}
        </div>

        <button
          className="nav-cta"
          onClick={() =>
            go("/workspace")
          }
        >
          <span>
            {page === "home"
              ? "Get started"
              : "All tools"}
          </span>

          <span className="cta-arrow">
            ↗
          </span>
        </button>

        <button
          className={`mobile-toggle ${
            mobileOpen ? "is-open" : ""
          }`}
          onClick={() =>
            setMobileOpen(
              (value) => !value
            )
          }
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          <span />
          <span />
        </button>
      </nav>
    </header>
  );
}

/* ============================================================
   SHARED FOOTER
   ============================================================ */

function Footer() {
  const go = (path) => {
    navigate(path);
  };

  return (
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
            onClick={() => go("/workspace")}
          >
            FreePDF
          </button>

          <button
            onClick={() => go("/workspace")}
          >
            All PDF tools
          </button>
        </div>

        <div className="footer-column">
          <span className="footer-heading">
            TOOLS
          </span>

          <button
            onClick={() => go("/merge")}
          >
            Merge PDF
          </button>

          <button
            onClick={() => go("/split")}
          >
            Split PDF
          </button>

          <button
            onClick={() => go("/compress")}
          >
            Compress PDF
          </button>

          <button
            onClick={() => go("/pdf-to-image")}
          >
            PDF → Image
          </button>

          <button
            onClick={() => go("/image-to-pdf")}
          >
            Image → PDF
          </button>

          <button
            onClick={() => go("/rearrange")}
          >
            Rearrange pages
          </button>

          <button
            onClick={() => go("/delete-pages")}
          >
            Delete pages
          </button>
        </div>

        <div className="footer-column">
          <span className="footer-heading">
            MORE TOOLS
          </span>

          <button
            onClick={() => go("/sign")}
          >
            Sign PDF
          </button>

          <button
            onClick={() => go("/fill-forms")}
          >
            Fill PDF forms
          </button>

          <button
            onClick={() =>
              go("/password-protect")
            }
          >
            Password protect
          </button>

          <button
            onClick={() => go("/metadata")}
          >
            PDF metadata
          </button>

          <a href="mailto:aarav.krish62442@gmail.com?subject=FreeToolz%20Feedback">
            Send feedback
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
  );
}

/* ============================================================
   TOOL PAGE
   ============================================================ */

function ToolPage({
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
    rearrange:
      "Put your pages in the right order.",
    "delete-pages":
      "Remove pages you don't need.",
    sign:
      "Sign your PDF.",
    "fill-forms":
      "Fill out PDF forms.",
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

/* ============================================================
   HOME PAGE
   ============================================================ */

function HomePage() {
  const [openFaq, setOpenFaq] =
    useState(null);

  const scrollTo = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <Header page="home" />

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
              your PDFs with a focused workspace
              built to get the job done.
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

                <span>↗</span>
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  scrollTo("how")
                }
              >
                See how it works
                <span>↓</span>
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
                <span>PDF</span>
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
              <span>01</span>

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
            <span>EDIT</span>
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
                <span>01</span>
                <span>INPUT</span>
              </div>

              <div className="step-visual">
                <div className="mini-file">
                  <span>PDF</span>
                </div>

                <div className="mini-plus">
                  +
                </div>

                <div className="mini-file ghost">
                  <span>PDF</span>
                </div>
              </div>

              <h3>
                Choose
              </h3>

              <p>
                Add the files you need.
                Drag them in or select
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

              <h3>
                Transform
              </h3>

              <p>
                Choose the operation
                you need and let the
                dedicated tool handle it.
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

              <h3>
                Done
              </h3>

              <p>
                Download the result
                and move on. No upgrade
                prompts between you
                and your file.
              </p>
            </article>
          </div>
        </section>

        {/* TOOL PREVIEW */}

        <section className="section">
          <div className="section-heading">
            <div>
              <span className="section-number">
                03
              </span>

              <span className="section-kicker">
                THE TOOLKIT
              </span>
            </div>

            <h2>
              Everything you need.
              <br />
              <span>
                Nothing you don't.
              </span>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              maxWidth: 1160,
              margin: "50px auto 0",
            }}
          >
            {TOOLS.map((tool) => (
              <button
                key={tool.path}
                type="button"
                onClick={() =>
                  navigate(tool.path)
                }
                className="step-card"
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  font: "inherit",
                }}
              >
                <div className="step-top">
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                    }}
                  >
                    {tool.icon}
                  </span>

                  <span>
                    PDF TOOL
                  </span>
                </div>

                <h3>
                  {tool.name}
                </h3>

                <p>
                  {tool.description}
                </p>

                <span
                  style={{
                    display: "inline-block",
                    marginTop: 12,
                    opacity: 0.65,
                    fontSize: 13,
                  }}
                >
                  Open tool ↗
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* PRIVACY */}

        <section
          className="privacy-section section"
          id="privacy"
        >
          <div className="privacy-card glass-panel">
            <div className="privacy-number">
              04
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
                unnecessary data collection and
                favor browser-side processing
                wherever the technology allows it.
              </p>

              <button
                className="text-button"
                onClick={() =>
                  scrollTo("faq")
                }
              >
                Read the FAQ
                <span>↗</span>
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
                05
              </span>

              <span className="section-kicker">
                QUESTIONS
              </span>
            </div>

            <h2>
              Straight answers.
            </h2>
          </div>

          <div
            className="faq-list"
            style={{
              maxWidth: 900,
              margin:
                "45px auto 0",
            }}
          >
            {FAQS.map(
              (faq, index) => {
                const isOpen =
                  openFaq === index;

                return (
                  <div
                    key={faq.question}
                    className={`faq-item ${
                      isOpen
                        ? "faq-open"
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaq(
                          isOpen
                            ? null
                            : index
                        )
                      }
                      style={{
                        width: "100%",
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        background:
                          "transparent",
                        border: 0,
                        color:
                          "inherit",
                        cursor:
                          "pointer",
                        textAlign:
                          "left",
                        font:
                          "inherit",
                      }}
                    >
                      <span>
                        {faq.question}
                      </span>

                      <span
                        style={{
                          fontSize: 22,
                          opacity:
                            0.65,
                          transform:
                            isOpen
                              ? "rotate(45deg)"
                              : "none",
                          transition:
                            "transform 180ms ease",
                        }}
                      >
                        +
                      </span>
                    </button>

                    {isOpen && (
                      <p>
                        {faq.answer}
                      </p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */

export default function App() {
  const getPath = () =>
    window.location.pathname || "/";

  const [path, setPath] =
    useState(getPath);

  useEffect(() => {
    const handlePopState = () => {
      setPath(getPath());

      window.scrollTo({
        top: 0,
        behavior: "smooth",
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

  useEffect(() => {
    document.title =
      path === "/"
        ? "FreePDF — PDFs. Without the nonsense."
        : "FreePDF — Free PDF Tools";
  }, [path]);

  /* Home */

  if (path === "/") {
    return <HomePage />;
  }

  /* Known tool routes */

  const mode =
    ROUTE_TO_MODE[path];

  if (
    mode &&
    VALID_MODES.has(mode)
  ) {
    return (
      <ToolPage mode={mode} />
    );
  }

  /*
    Unknown routes are redirected to the
    FreePDF workspace instead of rendering
    a broken/empty page.
  */

  return (
    <UnknownRoute
      onGoHome={() =>
        navigate("/")
      }
      onGoTools={() =>
        navigate("/workspace")
      }
    />
  );
}

/* ============================================================
   UNKNOWN ROUTE
   ============================================================ */

function UnknownRoute({
  onGoHome,
  onGoTools,
}) {
  return (
    <div className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <Header page="tool" />

      <main
        style={{
          minHeight:
            "70vh",
          display:
            "grid",
          placeItems:
            "center",
          padding:
            "150px 24px 80px",
        }}
      >
        <section
          className="glass-panel"
          style={{
            width:
              "min(680px, 100%)",
            padding:
              "56px 40px",
            textAlign:
              "center",
            borderRadius:
              28,
          }}
        >
          <span className="section-kicker">
            PAGE NOT FOUND
          </span>

          <h1
            style={{
              margin:
                "18px 0",
            }}
          >
            That page isn't
            <br />
            part of FreePDF.
          </h1>

          <p
            style={{
              maxWidth: 520,
              margin:
                "0 auto",
              opacity: 0.7,
              lineHeight: 1.7,
            }}
          >
            The link may be outdated, or
            the tool may have been moved.
            You can return home or open
            the FreePDF workspace.
          </p>

          <div
            className="hero-actions"
            style={{
              justifyContent:
                "center",
              marginTop: 30,
            }}
          >
            <button
              className="primary-button"
              onClick={onGoTools}
            >
              <span>
                Open FreePDF
              </span>

              <span>↗</span>
            </button>

            <button
              className="secondary-button"
              onClick={onGoHome}
            >
              Back home
              <span>↗</span>
            </button>
          </div>import React, { useEffect, useState } from "react";
import PDFWorkspace from "./PDFWorkspace";

/* =========================================================
   ROUTES
========================================================= */

const TOOL_ROUTES = {
  merge: "/merge",
  split: "/split",
  compress: "/compress",
  pdfToImage: "/pdf-to-image",
  imageToPdf: "/image-to-pdf",
  deletePages: "/delete-pages",
  sign: "/sign",
  passwordProtect: "/password-protect",
  metadata: "/metadata",
};

const ROUTE_TO_MODE = {
  "/merge": "merge",
  "/split": "split",
  "/compress": "compress",
  "/pdf-to-image": "pdfToImage",
  "/image-to-pdf": "imageToPdf",
  "/delete-pages": "deletePages",
  "/sign": "sign",
  "/password-protect": "passwordProtect",
  "/metadata": "metadata",
};

const VALID_ROUTES = new Set([
  "/",
  "/workspace",
  ...Object.values(TOOL_ROUTES),
]);

/* =========================================================
   TOOL DATA
========================================================= */

const TOOLS = [
  {
    id: "merge",
    route: TOOL_ROUTES.merge,
    mode: "merge",
    title: "Merge PDFs",
    shortTitle: "Merge",
    description:
      "Combine multiple PDF files into one clean document in seconds.",
    icon: "⊕",
  },
  {
    id: "split",
    route: TOOL_ROUTES.split,
    mode: "split",
    title: "Split PDFs",
    shortTitle: "Split",
    description:
      "Separate pages from a PDF and create the exact documents you need.",
    icon: "↗",
  },
  {
    id: "compress",
    route: TOOL_ROUTES.compress,
    mode: "compress",
    title: "Compress PDFs",
    shortTitle: "Compress",
    description:
      "Reduce PDF file size while keeping your document looking sharp.",
    icon: "⌁",
  },
  {
    id: "pdfToImage",
    route: TOOL_ROUTES.pdfToImage,
    mode: "pdfToImage",
    title: "PDF → JPG / PNG",
    shortTitle: "PDF → Image",
    description:
      "Turn PDF pages into high-quality JPG or PNG images.",
    icon: "▣",
  },
  {
    id: "imageToPdf",
    route: TOOL_ROUTES.imageToPdf,
    mode: "imageToPdf",
    title: "JPG / PNG → PDF",
    shortTitle: "Image → PDF",
    description:
      "Convert images into a polished PDF document with ease.",
    icon: "▤",
  },
  {
    id: "deletePages",
    route: TOOL_ROUTES.deletePages,
    mode: "deletePages",
    title: "Delete Pages",
    shortTitle: "Delete Pages",
    description:
      "Remove unwanted pages from a PDF without rebuilding the document.",
    icon: "−",
  },
  {
    id: "sign",
    route: TOOL_ROUTES.sign,
    mode: "sign",
    title: "Sign PDF",
    shortTitle: "Sign",
    description:
      "Add your signature to PDF documents quickly and conveniently.",
    icon: "✎",
  },
  {
    id: "passwordProtect",
    route: TOOL_ROUTES.passwordProtect,
    mode: "passwordProtect",
    title: "Password Protect PDF",
    shortTitle: "Protect",
    description:
      "Protect sensitive PDF documents with password-based encryption.",
    icon: "◇",
  },
  {
    id: "metadata",
    route: TOOL_ROUTES.metadata,
    mode: "metadata",
    title: "PDF Metadata Editor",
    shortTitle: "Metadata",
    description:
      "View and edit PDF title, author, subject, keywords, and other metadata.",
    icon: "◈",
  },
];

/* =========================================================
   FAQ DATA
========================================================= */

const FAQS = [
  {
    question: "Is FreePDF actually free?",
    answer:
      "Yes. FreePDF is built as a free utility. There are no subscriptions or paid feature walls.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. FreePDF runs directly in your browser, so there is nothing to install.",
  },
  {
    question: "Are my PDF files uploaded somewhere?",
    answer:
      "The core PDF tools are designed to process files directly in your browser whenever possible. Your files do not need to be uploaded simply to use the basic PDF workflow.",
  },
  {
    question: "Can I merge several PDFs together?",
    answer:
      "Yes. Use Merge PDFs to combine multiple PDF files into a single document.",
  },
  {
    question: "Can I split a PDF into separate files?",
    answer:
      "Yes. Split PDFs lets you choose the pages or ranges you want to separate.",
  },
  {
    question: "Can I reduce the size of a PDF?",
    answer:
      "Yes. Compress PDFs provides compression options designed to reduce file size while keeping the document useful and readable.",
  },
];

/* =========================================================
   NAVIGATION
========================================================= */

function navigate(path) {
  if (!path) return;

  if (window.location.pathname === path) {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    return;
  }

  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

/* =========================================================
   BRAND
========================================================= */

function Brand({ onClick }) {
  return (
    <button
      type="button"
      className="brand"
      onClick={() => {
        if (onClick) onClick();
        navigate("/");
      }}
      aria-label="FreePDF home"
    >
      <span className="brand-mark">
        <span className="brand-mark-inner">F</span>
      </span>

      <span className="brand-name">
        Free<span>PDF</span>
      </span>
    </button>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);

    window.addEventListener("popstate", closeMenu);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("popstate", closeMenu);
      window.removeEventListener("resize", closeMenu);
    };
  }, []);

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />

        <nav className="main-nav" aria-label="Main navigation">
          <button
            type="button"
            className="nav-link"
            onClick={() => go("/workspace")}
          >
            All Tools
          </button>

          <button
            type="button"
            className="nav-link"
            onClick={() => go("/merge")}
          >
            Merge
          </button>

          <button
            type="button"
            className="nav-link"
            onClick={() => go("/compress")}
          >
            Compress
          </button>

          <button
            type="button"
            className="nav-link nav-link-primary"
            onClick={() => go("/workspace")}
          >
            Get Started
          </button>
        </nav>

        <button
          type="button"
          className={`mobile-menu-button ${
            menuOpen ? "is-open" : ""
          }`}
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-nav">
          <button type="button" onClick={() => go("/workspace")}>
            All Tools
          </button>

          <button type="button" onClick={() => go("/merge")}>
            Merge PDFs
          </button>

          <button type="button" onClick={() => go("/split")}>
            Split PDFs
          </button>

          <button type="button" onClick={() => go("/compress")}>
            Compress PDFs
          </button>

          <button type="button" onClick={() => go("/pdf-to-image")}>
            PDF → JPG / PNG
          </button>

          <button type="button" onClick={() => go("/image-to-pdf")}>
            JPG / PNG → PDF
          </button>

          <button type="button" onClick={() => go("/delete-pages")}>
            Delete Pages
          </button>

          <button type="button" onClick={() => go("/sign")}>
            Sign PDF
          </button>

          <button type="button" onClick={() => go("/password-protect")}>
            Password Protect PDF
          </button>

          <button type="button" onClick={() => go("/metadata")}>
            PDF Metadata Editor
          </button>
        </div>
      )}
    </header>
  );
}

/* =========================================================
   FOOTER
========================================================= */

function Footer() {
  const year = new Date().getFullYear();

  return (
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

          <p className="footer-tagline">
            Useful software. Without the nonsense.
          </p>

          <div className="footer-status">
            <span className="footer-status-dot" />
            Building useful things
          </div>
        </div>

        <div className="footer-column">
          <h3>FreePDF</h3>

          <button type="button" onClick={() => navigate("/workspace")}>
            All PDF Tools
          </button>

          <button type="button" onClick={() => navigate("/merge")}>
            Merge PDFs
          </button>

          <button type="button" onClick={() => navigate("/split")}>
            Split PDFs
          </button>

          <button type="button" onClick={() => navigate("/compress")}>
            Compress PDFs
          </button>

          <button type="button" onClick={() => navigate("/pdf-to-image")}>
            PDF → JPG / PNG
          </button>
        </div>

        <div className="footer-column">
          <h3>More Tools</h3>

          <button type="button" onClick={() => navigate("/image-to-pdf")}>
            JPG / PNG → PDF
          </button>

          <button type="button" onClick={() => navigate("/delete-pages")}>
            Delete Pages
          </button>

          <button type="button" onClick={() => navigate("/sign")}>
            Sign PDF
          </button>

          <button
            type="button"
            onClick={() => navigate("/password-protect")}
          >
            Password Protect
          </button>

          <button type="button" onClick={() => navigate("/metadata")}>
            Metadata Editor
          </button>
        </div>

        <div className="footer-column">
          <h3>FreeToolz</h3>

          <button type="button" onClick={() => navigate("/")}>
            Home
          </button>

          <button type="button" onClick={() => navigate("/workspace")}>
            Get Started
          </button>

          <a href="#faq">FAQ</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {year} FreeToolz. Built for useful work.
        </span>

        <div className="footer-bottom-links">
          <a href="#privacy">Privacy</a>
          <a href="#copyright">Copyright</a>
          <a href="#feedback">Feedback</a>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================
   TOOL CARD
========================================================= */

function ToolCard({ tool }) {
  return (
    <button
      type="button"
      className="tool-card"
      onClick={() => navigate(tool.route)}
    >
      <span className="tool-card-icon">{tool.icon}</span>

      <span className="tool-card-content">
        <span className="tool-card-title">{tool.title}</span>

        <span className="tool-card-description">
          {tool.description}
        </span>
      </span>

      <span className="tool-card-arrow">→</span>
    </button>
  );
}

/* =========================================================
   HOME PAGE
========================================================= */

function HomePage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="app-page home-page">
      <Header />

      <main>
        {/* HERO */}
        <section className="hero-section">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />

          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Free PDF tools. No nonsense.
            </div>

            <h1>
              PDFs,
              <span> without the headache.</span>
            </h1>

            <p className="hero-description">
              Merge, split, compress, convert, sign, protect, and
              manage your PDFs with a clean toolkit built to get the
              job done.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => navigate("/workspace")}
              >
                Get Started
                <span>→</span>
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate("/merge")}
              >
                Merge a PDF
              </button>
            </div>

            <div className="hero-note">
              <span>✦</span>
              Free to use. No account required.
            </div>
          </div>
        </section>

        {/* TOOLS */}
        <section className="tools-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">THE TOOLKIT</span>

              <h2>Everything you actually need.</h2>
            </div>

            <p>
              A focused collection of useful PDF tools, without
              burying the good stuff behind clutter.
            </p>
          </div>

          <div className="tools-grid">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        {/* GET STARTED */}
        <section className="get-started-section">
          <div className="get-started-card">
            <div className="get-started-copy">
              <span className="section-kicker">READY WHEN YOU ARE</span>

              <h2>Start with a PDF.</h2>

              <p>
                Pick a tool, drop in your file, and get straight to
                work.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/workspace")}
            >
              Open FreePDF
              <span>→</span>
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq-section" id="faq">
          <div className="section-heading faq-heading">
            <div>
              <span className="section-kicker">FAQ</span>
              <h2>Questions, answered.</h2>
            </div>
          </div>

          <div className="faq-list">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  className={`faq-item ${
                    isOpen ? "faq-item-open" : ""
                  }`}
                  key={faq.question}
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() =>
                      setOpenFaq(isOpen ? null : index)
                    }
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>

                    <span className="faq-icon">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* =========================================================
   WORKSPACE PAGE
========================================================= */

function WorkspacePage() {
  return (
    <div className="app-page workspace-page">
      <Header />

      <main className="workspace-page-main">
        <section className="workspace-intro">
          <span className="section-kicker">FREEPDF WORKSPACE</span>

          <h1>Choose your tool.</h1>

          <p>
            Select what you want to do with your PDF and get started.
          </p>
        </section>

        <section className="workspace-tools">
          <div className="tools-grid">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* =========================================================
   TOOL PAGE
========================================================= */

function ToolPage({ mode }) {
  const tool = TOOLS.find((item) => item.mode === mode);

  if (!tool) {
    return <UnknownRoute />;
  }

  return (
    <div className="app-page tool-page">
      <Header />

      <main>
        <section className="tool-page-header">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/workspace")}
          >
            ← All Tools
          </button>

          <div className="tool-page-heading">
            <span className="section-kicker">FREEPDF TOOL</span>

            <h1>{tool.title}</h1>

            <p>{tool.description}</p>
          </div>
        </section>

        <PDFWorkspace mode={mode} />
      </main>

      <Footer />
    </div>
  );
}

/* =========================================================
   UNKNOWN ROUTE
========================================================= */

function UnknownRoute() {
  return (
    <div className="app-page unknown-page">
      <Header />

      <main className="unknown-page-main">
        <div className="unknown-card">
          <span className="unknown-code">404</span>

          <h1>Page not found.</h1>

          <p>
            That FreePDF page doesn't exist. Let's get you back to
            something useful.
          </p>

          <div className="unknown-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/")}
            >
              Back Home
              <span>→</span>
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/workspace")}
            >
              View Tools
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [path, setPath] = useState(
    window.location.pathname || "/"
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname || "/");
    };

    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener(
        "popstate",
        handleLocationChange
      );
    };
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [path]);

  /* Home */
  if (path === "/") {
    return <HomePage />;
  }

  /* Workspace */
  if (path === "/workspace") {
    return <WorkspacePage />;
  }

  /* Tool routes */
  if (ROUTE_TO_MODE[path]) {
    return <ToolPage mode={ROUTE_TO_MODE[path]} />;
  }

  /* Unknown route */
  return <UnknownRoute />;
}
