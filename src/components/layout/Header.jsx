import React, { useState } from "react";
import { TOOLS } from "../../data/toolData";
import { navigate } from "../../lib/navigation";

export default function Header({
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
          aria-label="FreePDF home"
        >
          <img
            className="brand-favicon"
            src="/favicon.svg"
            alt=""
            aria-hidden="true"
          />

          <span className="brand-name">
            Free<span>PDF</span>
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
