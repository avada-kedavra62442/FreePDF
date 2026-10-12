import React from "react";
import Header from "../layout/Header";
import Footer from "../layout/Footer";

export default function UnknownRoute({
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
