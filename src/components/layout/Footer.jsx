import React from "react";
import { FaGithub, FaEnvelope, FaLinkedin } from "react-icons/fa";
import { navigate } from "../../lib/navigation";

export default function Footer() {
  const go = (path) => {
    navigate(path);
  };

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <div className="footer-brand-row">
            <img
              className="footer-favicon"
              src="/favicon.svg"
              alt=""
              aria-hidden="true"
            />

            <span className="footer-brand-name">
              Free<span>PDF</span>
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
          © 2026 FreePDF. All rights reserved.
        </span>

        <span className="footer-line" />

        <span>
          BUILT FOR THE WEB · BUILT TO BE USEFUL
        </span>
      </div>
    </footer>
  );
}
