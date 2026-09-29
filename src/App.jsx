import {
  ArrowRight,
  FileArchive,
  FileImage,
  FilePlus2,
  Files,
  LockKeyhole,
  Menu,
  Scissors,
  ShieldCheck,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

const tools = [
  {
    icon: FilePlus2,
    title: "Merge PDF",
    description: "Combine multiple PDFs into one.",
    category: "Organize",
  },
  {
    icon: Scissors,
    title: "Split PDF",
    description: "Split pages into separate PDFs.",
    category: "Organize",
  },
  {
    icon: Files,
    title: "Organize PDF",
    description: "Reorder, rotate or delete pages.",
    category: "Organize",
  },
  {
    icon: FileArchive,
    title: "Compress PDF",
    description: "Reduce PDF file size.",
    category: "Optimize",
  },
  {
    icon: FileImage,
    title: "PDF to JPG",
    description: "Convert PDF pages to images.",
    category: "Convert",
  },
  {
    icon: FilePlus2,
    title: "JPG to PDF",
    description: "Turn images into a PDF.",
    category: "Convert",
  },
  {
    icon: LockKeyhole,
    title: "Protect PDF",
    description: "Password-protect a PDF.",
    category: "Security",
  },
  {
    icon: ShieldCheck,
    title: "Sign PDF",
    description: "Add a signature to your document.",
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

    setSelectedFiles(files);
  };

  const openPicker = () => {
    inputRef.current?.click();
  };

  const removeFile = (index) => {
    setSelectedFiles((files) => files.filter((_, i) => i !== index));
  };

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#top">
          <span className="brand-mark">F</span>
          <span>FreePDF</span>
        </a>

        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="#tools" onClick={() => setMenuOpen(false)}>
            PDF Tools
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            About
          </a>
          <a href="#privacy" onClick={() => setMenuOpen(false)}>
            Privacy
          </a>
        </nav>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Open menu"
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <ShieldCheck size={15} />
              Free PDF tools • No account required
            </div>

            <h1>
              Everything you need
              <br />
              <span>to work with PDFs.</span>
            </h1>

            <p>
              Merge, split, compress, convert and organize your PDFs.
              No ads. No watermark. No unnecessary signup.
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

          <div className="dropzone">
            <div className="drop-icon">
              <FilePlus2 size={30} />
            </div>

            <h2>
              {selectedFiles.length
                ? `${selectedFiles.length} PDF${
                    selectedFiles.length === 1 ? "" : "s"
                  } selected`
                : "Drop your PDFs here"}
            </h2>

            <p>
              {selectedFiles.length
                ? "Your files are ready to use."
                : "or choose files from your device"}
            </p>

            <button className="choose-button" onClick={openPicker}>
              {selectedFiles.length ? "Add more PDFs" : "Choose PDF files"}
            </button>

            <small>
              Files are handled in your browser whenever possible.
            </small>
          </div>

          {selectedFiles.length > 0 && (
            <div className="selected-files">
              {selectedFiles.map((file, index) => (
                <div className="file-row" key={`${file.name}-${index}`}>
                  <div className="file-info">
                    <span className="file-symbol">
                      <FileImage size={17} />
                    </span>

                    <span>
                      <strong>{file.name}</strong>
                      <small>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </small>
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

              <button className="continue-button">
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </section>

        <section className="tools-section" id="tools">
          <div className="section-top">
            <div>
              <span className="section-label">PDF TOOLKIT</span>
              <h2>Pick a tool.</h2>
            </div>

            <span className="tool-count">8 tools available</span>
          </div>

          <div className="tools-grid">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <button className="tool-card" key={tool.title}>
                  <span className="tool-icon">
                    <Icon size={21} />
                  </span>

                  <span className="tool-content">
                    <span className="tool-category">{tool.category}</span>
                    <strong>{tool.title}</strong>
                    <span>{tool.description}</span>
                  </span>

                  <ArrowRight className="tool-arrow" size={18} />
                </button>
              );
            })}
          </div>
        </section>

        <section className="info-grid">
          <div className="info-card" id="privacy">
            <ShieldCheck size={24} />
            <h3>Privacy first</h3>
            <p>
              We design FreePDF around browser-side processing wherever
              practical, so simple PDF tasks don't need an unnecessary upload.
            </p>
          </div>

          <div className="info-card" id="about">
            <Files size={24} />
            <h3>Actually free</h3>
            <p>
              No forced account, no watermark and no artificial “3 files
              today” restriction.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <strong>FreePDF</strong>
        <span>Useful PDF tools without the usual nonsense.</span>
      </footer>
    </div>
  );
}

export default App;
