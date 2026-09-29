import {
  ArrowRight,
  FileArchive,
  FileImage,
  FileOutput,
  FilePlus2,
  Files,
  LockKeyhole,
  Menu,
  Scissors,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

const tools = [
  {
    icon: FilePlus2,
    title: "Merge PDF",
    description: "Combine multiple PDF files into one document.",
    category: "Organize",
  },
  {
    icon: Scissors,
    title: "Split PDF",
    description: "Separate pages or ranges into individual PDFs.",
    category: "Organize",
  },
  {
    icon: Files,
    title: "Organize PDF",
    description: "Reorder, rotate, delete and extract pages.",
    category: "Organize",
  },
  {
    icon: FileArchive,
    title: "Compress PDF",
    description: "Reduce PDF size while keeping it useful.",
    category: "Optimize",
  },
  {
    icon: FileImage,
    title: "PDF to JPG",
    description: "Turn PDF pages into downloadable images.",
    category: "Convert",
  },
  {
    icon: FileOutput,
    title: "JPG to PDF",
    description: "Turn images into a clean PDF document.",
    category: "Convert",
  },
  {
    icon: LockKeyhole,
    title: "Protect PDF",
    description: "Add password protection to your document.",
    category: "Security",
  },
  {
    icon: Sparkles,
    title: "More PDF Tools",
    description: "More useful PDF utilities are coming.",
    category: "More",
  },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToTools = () => {
    document.getElementById("tools")?.scrollIntoView({
      behavior: "smooth",
    });
    setMenuOpen(false);
  };

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#top" aria-label="FreePDF home">
          <span className="brand-mark">
            <FileOutput size={21} strokeWidth={2.4} />
          </span>

          <span className="brand-name">FreePDF</span>
        </a>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <button onClick={scrollToTools}>Tools</button>
          <a href="#privacy" onClick={() => setMenuOpen(false)}>
            Privacy
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            About
          </a>
        </nav>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-badge">
            <ShieldCheck size={16} />
            Private by design
          </div>

          <h1>
            Your PDF.
            <br />
            <span>Your control.</span>
          </h1>

          <p className="hero-description">
            Free PDF tools without ads, watermarks, forced accounts or
            artificial daily limits.
          </p>

          <div className="hero-actions">
            <button className="primary-button" onClick={scrollToTools}>
              Explore PDF tools
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="trust-row">
            <span>
              <ShieldCheck size={15} />
              Browser-first
            </span>

            <span>
              <FilePlus2 size={15} />
              No watermark
            </span>

            <span>
              <LockKeyhole size={15} />
              No forced account
            </span>
          </div>
        </section>

        <section className="tools-section" id="tools">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PDF TOOLKIT</p>
              <h2>Everything you actually need.</h2>
            </div>

            <p>
              Simple tools for everyday PDF work, designed around privacy
              rather than subscriptions.
            </p>
          </div>

          <div className="tools-grid">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <button className="tool-card" key={tool.title}>
                  <span className="tool-icon">
                    <Icon size={22} />
                  </span>

                  <span className="tool-category">{tool.category}</span>

                  <span className="tool-title">{tool.title}</span>

                  <span className="tool-description">
                    {tool.description}
                  </span>

                  <span className="tool-arrow">
                    <ArrowRight size={17} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="principles" id="privacy">
          <div className="principles-copy">
            <p className="eyebrow">THE FREEPDF PROMISE</p>

            <h2>
              Useful software shouldn't need
              <span> an upgrade button.</span>
            </h2>

            <p>
              FreePDF is designed around a simple idea: if a task can safely
              happen in your browser, it should not need to be uploaded to a
              server just to process it.
            </p>
          </div>

          <div className="principles-list">
            <div>
              <ShieldCheck size={20} />
              <span>
                <strong>Local-first</strong>
                <small>
                  Browser processing whenever the technology allows it.
                </small>
              </span>
            </div>

            <div>
              <Files size={20} />
              <span>
                <strong>No artificial limits</strong>
                <small>
                  No fake “3 files today” barrier built into the product.
                </small>
              </span>
            </div>

            <div>
              <LockKeyhole size={20} />
              <span>
                <strong>No forced account</strong>
                <small>
                  You should be able to use a PDF tool without creating a
                  profile.
                </small>
              </span>
            </div>
          </div>
        </section>

        <section className="about-section" id="about">
          <p className="eyebrow">ABOUT FREEPDF</p>
          <h2>Built to be useful.</h2>
          <p>
            FreePDF is part of a larger collection of free browser-first
            utilities. The goal is straightforward: make useful tools
            accessible without turning every simple task into a subscription.
          </p>
        </section>
      </main>

      <footer className="footer">
        <div>
          <strong>FreePDF</strong>
          <span>Free tools. No nonsense.</span>
        </div>

        <span>Built for people, not subscriptions.</span>
      </footer>
    </div>
  );
}

export default App;
