import React, { useState } from "react";
import { TOOLS, FAQS } from "../../data/toolData";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import InstallFreePDF from "../pwa/InstallFreePDF";
import { navigate } from "../../lib/navigation";

export default function HomePage() {
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
