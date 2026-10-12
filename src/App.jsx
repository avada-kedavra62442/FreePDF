import React, { useEffect, useState } from "react";
import { TOOL_ROUTES, ROUTE_TO_MODE, VALID_MODES } from "./config/routes";
import { TOOLS, FAQS } from "./data/toolData";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ToolPage from "./components/pages/ToolPage";
import InstallFreePDF from "./components/pwa/InstallFreePDF";
import { navigate } from "./lib/navigation";
import "./styles.css";

/* ============================================================
   FREEPDF ROUTING
   ============================================================ */

/* ============================================================
   TOOL DATA
   ============================================================ */

/* ============================================================
   SHARED HEADER
   ============================================================ */

/* ============================================================
   SHARED FOOTER
   ============================================================ */

/* ============================================================
   TOOL PAGE
   ============================================================ */

/* ============================================================
   PWA INSTALL
   ============================================================ */

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

              <InstallFreePDF />
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
            <span>EDIT</span>
            <b>✦</b>
            <span>MANAGE</span>
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
                  color: "var(--silver-1)",
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

          <div className="faq-list">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <article
                  key={faq.question}
                  className={`faq-item ${isOpen ? "faq-open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-question-button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span className="faq-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="faq-question-text">
                      {faq.question}
                    </span>
                    <span className="faq-toggle" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  <div className="faq-answer-wrap" hidden={!isOpen}>
                    <p className="faq-answer">{faq.answer}</p>
                  </div>
                </article>
              );
            })}
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
    const siteUrl = "https://free-pdf-delta.vercel.app";
    const seoByPath = {
      "/": {
        title: "FreePDF — Free PDF Tools, Free Forever",
        description: "Merge, split and compress PDFs with FreePDF. Free browser-based PDF tools with no ads, no watermarks and no forced account.",
      },
      "/workspace": {
        title: "Free PDF Workspace — FreePDF",
        description: "Open FreePDF's free online PDF workspace and choose a tool for common PDF tasks.",
      },
      "/merge": {
        title: "Merge PDF Files Online Free — FreePDF",
        description: "Combine multiple PDF files into one document with FreePDF. A free, simple PDF merger with no watermarks.",
      },
      "/split": {
        title: "Split PDF Pages Online Free — FreePDF",
        description: "Split a PDF into separate pages or selected page ranges with FreePDF's free online PDF splitter.",
      },
      "/compress": {
        title: "Compress PDF Online Free — FreePDF",
        description: "Reduce PDF file size with FreePDF's free PDF compressor. Prepare smaller PDFs for sharing.",
      },
      "/pdf-to-image": {
        title: "Convert PDF to JPG or PNG Free — FreePDF",
        description: "Turn PDF pages into JPG or PNG images with FreePDF's free PDF-to-image tool.",
      },
      "/image-to-pdf": {
        title: "Convert JPG or PNG to PDF Free — FreePDF",
        description: "Combine JPG or PNG images into a PDF document with FreePDF's free image-to-PDF converter.",
      },
      "/sign": {
        title: "Sign PDF Online Free — FreePDF",
        description: "Add a signature to your PDF with FreePDF's free online PDF signing tool.",
      },
      "/password-protect": {
        title: "Password Protect a PDF Free — FreePDF",
        description: "Protect a PDF with a password using FreePDF's PDF protection tool.",
      },
      "/metadata": {
        title: "Edit PDF Metadata Online Free — FreePDF",
        description: "Edit PDF document metadata such as title, author, subject and keywords with FreePDF.",
      },
    };
    const seo = seoByPath[path] || {
      title: "Page Not Found — FreePDF",
      description: "This FreePDF page could not be found. Return to FreePDF to explore free PDF tools.",
    };
    document.title = seo.title;

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute("content", seo.description);

    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute("href", siteUrl + (path === "/" ? "/" : path));

    const setMeta = (selector, attribute, key, value) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attribute, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", value);
    };
    setMeta('meta[property="og:title"]', "property", "og:title", seo.title);
    setMeta('meta[property="og:description"]', "property", "og:description", seo.description);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:url"]', "property", "og:url", siteUrl + (path === "/" ? "/" : path));
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary");

    document.documentElement.lang = "en";
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
