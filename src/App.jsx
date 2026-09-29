import {
  ArrowRight,
  Check,
  ChevronRight,
  FileArchive,
  FileImage,
  FilePlus2,
  Files,
  LockKeyhole,
  Menu,
  Scissors,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

const tools = [
  {
    icon: FilePlus2,
    title: "Merge PDF",
    description: "Combine files into one PDF",
    category: "Organize",
  },
  {
    icon: Scissors,
    title: "Split PDF",
    description: "Separate pages or ranges",
    category: "Organize",
  },
  {
    icon: Files,
    title: "Organize PDF",
    description: "Reorder, rotate or delete",
    category: "Organize",
  },
  {
    icon: FileArchive,
    title: "Compress PDF",
    description: "Make your PDF smaller",
    category: "Optimize",
  },
  {
    icon: FileImage,
    title: "PDF to JPG",
    description: "Convert pages to images",
    category: "Convert",
  },
  {
    icon: FilePlus2,
    title: "JPG to PDF",
    description: "Create a PDF from images",
    category: "Convert",
  },
  {
    icon: LockKeyhole,
    title: "Protect PDF",
    description: "Add password protection",
    category: "Security",
  },
  {
    icon: ShieldCheck,
    title: "Sign PDF",
    description: "Add your signature",
    category: "Security",
  },
];

function App() {
  const inputRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []).filter(
      (file) => file.type === "application/pdf"
    );

    setSelectedFiles((current) => [...current, ...files]);
    event.target.value = "";
  };

  const removeFile = (index) => {
    setSelectedFiles((files) => files.filter((_, i) => i !== index));
  };

  const openPicker = () => {
    inputRef.current?.click();
  };

  const scrollToTools = () => {
    document.getElementById("tools")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="navbar">
        <a className="brand" href="#top">
          <span className="brand-mark">
            <span>F</span>
          </span>

          <span className="brand-name">FreePDF</span>
        </a>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <a href="#tools" onClick={() => setMenuOpen(false)}>
            Tools
          </a>

          <a href="#why" onClick={() => setMenuOpen(false)}>
            Why FreePDF
          </a>

          <a href="#privacy" onClick={() => setMenuOpen(false)}>
            Privacy
          </a>
        </nav>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-heading">
            <div className="hero-pill">
              <Sparkles size={14} />
              <span>Simple PDF tools. No subscription.</span>
            </div>

            <h1>
              PDFs, without
              <span> the nonsense.</span>
            </h1>

            <p>
              Edit, organize, convert and compress your documents with tools
              designed to stay simple, private and genuinely free.
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={handleFiles}
          />

          <div className="workspace-shell">
            <div className="workspace-top">
              <div>
                <span className="workspace-label">START A PDF TASK</span>
                <strong>Choose your files</strong>
              </div>

              <div className="workspace-status">
                <span className="status-dot" />
                Browser-first
              </div>
            </div>

            <div className="dropzone" onClick={openPicker}>
              <div className="upload-orb">
                <FilePlus2 size={27} />
              </div>

              <h2>
                {selectedFiles.length
                  ? `${selectedFiles.length} PDF${
                      selectedFiles.length === 1 ? "" : "s"
                    } selected`
                  : "Drop your PDF files here"}
              </h2>

              <p>
                {selectedFiles.length
                  ? "Add more files or continue with your selection."
                  : "Drag & drop or choose files from your device"}
              </p>

              <button
                className="choose-button"
                onClick={(event) => {
                  event.stopPropagation();
                  openPicker();
                }}
              >
                {selectedFiles.length ? "Add more files" : "Choose files"}
              </button>

              <span className="drop-hint">
                PDF files • No account required
              </span>
            </div>

            {selectedFiles.length > 0 && (
              <div className="selected-area">
                <div className="selected-heading">
                  <span>
                    Selected files
                    <b>{selectedFiles.length}</b>
                  </span>

                  <button onClick={() => setSelectedFiles([])}>
                    Clear all
                  </button>
                </div>

                <div className="file-list">
                  {selectedFiles.map((file, index) => (
                    <div className="file-row" key={`${file.name}-${index}`}>
                      <div className="file-icon">
                        <FileImage size={17} />
                      </div>

                      <div className="file-details">
                        <strong>{file.name}</strong>
                        <span>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>

                      <button
                        className="remove-file"
                        onClick={() => removeFile(index)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ))}
                </div>

                <button className="continue-button">
                  Continue with files
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
          </div>

          <div className="trust-strip">
            <span>
              <Check size={14} />
              No watermark
            </span>

            <span>
              <Check size={14} />
              No forced account
            </span>

            <span>
              <Check size={14} />
              No ads
            </span>

            <span>
              <ShieldCheck size={14} />
              Privacy-first
            </span>
          </div>
        </section>

        <section className="tools-section" id="tools">
          <div className="section-header">
            <div>
              <span className="section-kicker">TOOLS</span>
              <h2>Everything in one place.</h2>
            </div>

            <button onClick={scrollToTools}>
              Browse tools
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="tools-grid">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <button className="tool-card" key={tool.title}>
                  <div className="tool-card-top">
                    <span className="tool-icon">
                      <Icon size={20} />
                    </span>

                    <ChevronRight
                      className="tool-chevron"
                      size={17}
                    />
                  </div>

                  <div className="tool-card-text">
                    <span>{tool.category}</span>
                    <strong>{tool.title}</strong>
                    <p>{tool.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="why-section" id="why">
          <div className="why-heading">
            <span className="section-kicker">THE IDEA</span>

            <h2>
              A useful tool shouldn't
              <span> need a subscription.</span>
            </h2>

            <p>
              FreePDF is being built around a simple principle: give people
              the tool they came for, without adding unnecessary friction.
            </p>
          </div>

          <div className="why-cards">
            <div className="why-card">
              <span className="why-number">01</span>
              <ShieldCheck size={21} />
              <h3>Privacy first</h3>
              <p>
                Browser-side processing whenever practical, so simple jobs
                don't need an unnecessary trip to a server.
              </p>
            </div>

            <div className="why-card">
              <span className="why-number">02</span>
              <Files size={21} />
              <h3>No artificial limits</h3>
              <p>
                No fake daily counters designed to push you toward a payment
                screen.
              </p>
            </div>

            <div className="why-card">
              <span className="why-number">03</span>
              <LockKeyhole size={21} />
              <h3>No forced account</h3>
              <p>
                Open the website, use the tool and get your file. That's it.
              </p>
            </div>
          </div>
        </section>

        <section className="privacy-section" id="privacy">
          <div className="privacy-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <span>PRIVACY</span>
            <h2>Your files are yours.</h2>
            <p>
              FreePDF is designed to keep processing in your browser whenever
              the technology allows it. We don't need your documents to make
              the basic tools useful.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-mark small">F</span>
          <strong>FreePDF</strong>
        </div>

        <span>Free tools. No nonsense.</span>
      </footer>
    </div>
  );
}

export default App;
