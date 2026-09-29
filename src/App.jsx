import { useRef, useState } from "react";
import {
ArrowDownRight,
ArrowRight,
Check,
ChevronDown,
FileArchive,
FileImage,
FilePenLine,
FilePlus2,
FileStack,
FileText,
FolderOpen,
LockKeyhole,
Menu,
Minimize2,
MoveRight,
ScanText,
ShieldCheck,
Sparkles,
Upload,
X,
} from "lucide-react";
import "./styles.css";

const tools = [
{
title: "Merge PDF",
description: "Bring multiple documents together into one clean PDF.",
icon: FileStack,
tag: "ORGANIZE",
large: true,
},
{
title: "Compress PDF",
description: "Shrink file size while keeping your documents usable.",
icon: Minimize2,
tag: "OPTIMIZE",
},
{
title: "Split PDF",
description: "Extract the pages you actually need.",
icon: FilePlus2,
tag: "ORGANIZE",
},
{
title: "PDF to JPG",
description: "Turn PDF pages into high-quality images.",
icon: FileImage,
tag: "CONVERT",
},
{
title: "JPG to PDF",
description: "Turn images into a polished PDF document.",
icon: FileImage,
tag: "CONVERT",
},
{
title: "Organize PDF",
description: "Reorder, rotate, remove and extract pages.",
icon: FileText,
tag: "EDIT",
large: true,
},
{
title: "Protect PDF",
description: "Add protection to sensitive documents.",
icon: LockKeyhole,
tag: "SECURITY",
},
{
title: "Sign PDF",
description: "Add your signature without printing anything.",
icon: FilePenLine,
tag: "SIGN",
},
];

function App() {
const fileInput = useRef(null);
const [files, setFiles] = useState([]);
const [menuOpen, setMenuOpen] = useState(false);

const chooseFiles = () => fileInput.current?.click();

const handleFiles = (event) => {
const incoming = Array.from(event.target.files || []);


const pdfs = incoming.filter(
  (file) =>
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
);

setFiles((current) => [...current, ...pdfs]);
event.target.value = "";


};

const removeFile = (index) => {
setFiles((current) => current.filter((_, i) => i !== index));
};

const clearFiles = () => setFiles([]);

const scrollTo = (id) => {
document.getElementById(id)?.scrollIntoView({
behavior: "smooth",
block: "start",
});
setMenuOpen(false);
};

return ( <div className="site"> <div className="noise" />


  <div className="ambient ambient-one" />
  <div className="ambient ambient-two" />
  <div className="ambient ambient-three" />

  <header className="nav-shell">
    <nav className="nav glass-panel">
      <button className="brand" onClick={() => scrollTo("top")}>
        <span className="brand-mark">
          <span />
          <span />
          <span />
        </span>
        <span className="brand-name">FreePDF</span>
      </button>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <button onClick={() => scrollTo("tools")}>Tools</button>
        <button onClick={() => scrollTo("experience")}>How it works</button>
        <button onClick={() => scrollTo("privacy")}>Privacy</button>
        <button onClick={() => scrollTo("faq")}>FAQ</button>
      </div>

      <button className="nav-action" onClick={chooseFiles}>
        Open PDF
        <ArrowUpRightIcon />
      </button>

      <button
        className="mobile-menu"
        aria-label="Open menu"
        onClick={() => setMenuOpen((value) => !value)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </nav>
  </header>

  <main id="top">
    {/* HERO */}
    <section className="hero section">
      <div className="hero-grid" />

      <div className="hero-copy reveal">
        <div className="eyebrow">
          <span className="status-dot" />
          PDF tools, redesigned
        </div>

        <h1>
          PDFs.
          <br />
          <span className="silver-text">Without</span>{" "}
          <span className="emerald-text">the nonsense.</span>
        </h1>

        <p className="hero-description">
          A beautifully simple collection of PDF tools designed to get
          things done — without subscriptions, watermarks or unnecessary
          friction.
        </p>

        <div className="hero-buttons">
          <button className="primary-button" onClick={chooseFiles}>
            <Upload size={18} />
            Drop a PDF
            <span className="button-shine" />
          </button>

          <button
            className="secondary-button"
            onClick={() => scrollTo("tools")}
          >
            Explore tools
            <ArrowDownRight size={18} />
          </button>
        </div>

        <div className="hero-trust">
          <span>
            <Check size={14} /> No account
          </span>
          <span>
            <Check size={14} /> No watermark
          </span>
          <span>
            <Check size={14} /> No ads
          </span>
        </div>
      </div>

      <div className="hero-visual">
        <div className="orbital orbital-a" />
        <div className="orbital orbital-b" />

        <div className="pdf-stack">
          <div className="floating-page page-back">
            <div className="page-lines">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="floating-page page-middle">
            <div className="page-top">
              <span>PDF</span>
              <FileText size={21} />
            </div>
            <div className="page-lines">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="floating-page page-front">
            <div className="pdf-symbol">
              <FileText size={38} />
            </div>
            <strong>PDF</strong>
            <small>READY WHEN YOU ARE</small>
          </div>
        </div>

        <div className="floating-chip chip-one glass-panel">
          <ShieldCheck size={17} />
          <span>Privacy first</span>
        </div>

        <div className="floating-chip chip-two glass-panel">
          <Sparkles size={17} />
          <span>Simple by design</span>
        </div>

        <div className="hero-ring" />
      </div>

      <div className="scroll-cue">
        <span>SCROLL TO EXPLORE</span>
        <span className="scroll-line" />
      </div>
    </section>

    {/* MARQUEE */}
    <section className="marquee-section">
      <div className="marquee">
        <span>MERGE</span>
        <b>✦</b>
        <span>COMPRESS</span>
        <b>✦</b>
        <span>ORGANIZE</span>
        <b>✦</b>
        <span>CONVERT</span>
        <b>✦</b>
        <span>SIGN</span>
        <b>✦</b>
        <span>PROTECT</span>
        <b>✦</b>
        <span>MERGE</span>
        <b>✦</b>
        <span>COMPRESS</span>
      </div>
    </section>

    {/* INTRO */}
    <section className="intro section">
      <div className="section-label">01 / THE IDEA</div>

      <div className="intro-layout">
        <h2>
          Everything you need.
          <br />
          <em>Nothing you don't.</em>
        </h2>

        <div className="intro-side">
          <p>
            PDF software became complicated somewhere along the way.
            FreePDF takes a different approach: put the useful tools
            together, remove the friction, and let the document stay the
            focus.
          </p>

          <button className="text-button" onClick={() => scrollTo("tools")}>
            Discover FreePDF <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>

    {/* UPLOAD WORKSPACE */}
    <section className="workspace-section section">
      <div className="workspace-copy">
        <div className="section-label">02 / YOUR WORKSPACE</div>
        <h2>
          Start with
          <br />
          <span>your document.</span>
        </h2>
        <p>
          Drop a PDF into your workspace and choose what happens next.
          No maze of menus. No clutter.
        </p>
      </div>

      <div className="workspace-shell glass-panel">
        <div className="workspace-top">
          <div className="window-dots">
            <i />
            <i />
            <i />
          </div>
          <span>FREEPDF / WORKSPACE</span>
          <span className="workspace-status">
            <i /> READY
          </span>
        </div>

        <div
          className={`drop-zone ${files.length ? "has-files" : ""}`}
          onClick={chooseFiles}
        >
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={handleFiles}
          />

          {!files.length ? (
            <>
              <div className="drop-icon">
                <FolderOpen size={28} />
              </div>

              <h3>Drop your PDF here</h3>
              <p>or click to browse your device</p>

              <div className="drop-meta">
                <span>PDF</span>
                <span>•</span>
                <span>Multiple files supported</span>
              </div>
            </>
          ) : (
            <div className="file-list" onClick={(event) => event.stopPropagation()}>
              <div className="file-list-header">
                <div>
                  <strong>{files.length} PDF{files.length > 1 ? "s" : ""}</strong>
                  <span>Ready in workspace</span>
                </div>
                <button onClick={clearFiles}>Clear all</button>
              </div>

              {files.map((file, index) => (
                <div className="file-row" key={`${file.name}-${index}`}>
                  <div className="file-icon">
                    <FileText size={18} />
                  </div>

                  <div className="file-info">
                    <strong>{file.name}</strong>
                    <span>{formatBytes(file.size)}</span>
                  </div>

                  <button
                    className="remove-file"
                    onClick={() => removeFile(index)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              <button className="continue-button" onClick={chooseFiles}>
                Add another PDF
                <PlusIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>

    {/* TOOLS */}
    <section id="tools" className="tools-section section">
      <div className="tools-heading">
        <div>
          <div className="section-label">03 / THE TOOLKIT</div>
          <h2>
            Meet your new
            <br />
            <span>PDF toolbox.</span>
          </h2>
        </div>

        <p>
          Eight essential tools to handle the documents that keep getting
          in the way.
        </p>
      </div>

      <div className="tools-grid">
        {tools.map((tool, index) => {
          const Icon = tool.icon;

          return (
            <button
              className={`tool-card ${tool.large ? "large" : ""}`}
              key={tool.title}
              onClick={chooseFiles}
              style={{ "--delay": `${index * 70}ms` }}
            >
              <div className="tool-card-top">
                <span className="tool-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="tool-tag">{tool.tag}</span>
              </div>

              <div className="tool-icon">
                <Icon size={25} strokeWidth={1.6} />
              </div>

              <div className="tool-card-bottom">
                <div>
                  <h3>{tool.title}</h3>
                  <p>{tool.description}</p>
                </div>
                <span className="tool-arrow">
                  <ArrowUpRightIcon />
                </span>
              </div>

              <div className="card-glow" />
            </button>
          );
        })}
      </div>
    </section>

    {/* EXPERIENCE */}
    <section id="experience" className="experience-section section">
      <div className="section-label">04 / THE EXPERIENCE</div>

      <div className="experience-title">
        <h2>
          Simple is
          <br />
          <span>powerful.</span>
        </h2>
      </div>

      <div className="experience-stage">
        <div className="experience-line line-one" />
        <div className="experience-line line-two" />

        <div className="experience-card card-left glass-panel">
          <span>01</span>
          <FileArchive size={28} />
          <h3>Choose</h3>
          <p>Drop in your document. That's it.</p>
        </div>

        <div className="experience-card card-center glass-panel">
          <span>02</span>
          <Sparkles size={28} />
          <h3>Transform</h3>
          <p>Pick the tool that gets the job done.</p>
        </div>

        <div className="experience-card card-right glass-panel">
          <span>03</span>
          <MoveRight size={28} />
          <h3>Done</h3>
          <p>Download your finished document.</p>
        </div>
      </div>
    </section>

    {/* PRIVACY */}
    <section id="privacy" className="privacy-section section">
      <div className="privacy-orb" />

      <div className="section-label">05 / YOUR DOCUMENTS</div>

      <div className="privacy-layout">
        <h2>
          Your files.
          <br />
          <span>Your business.</span>
        </h2>

        <div className="privacy-content">
          <p>
            FreePDF is designed around a simple principle: documents
            belong to the person using them. Wherever practical, processing
            should happen directly in your browser instead of sending
            files somewhere else.
          </p>

          <div className="privacy-points">
            <div>
              <ShieldCheck size={21} />
              <span>
                <strong>Privacy-first</strong>
                <small>Built around minimal data handling.</small>
              </span>
            </div>

            <div>
              <LockKeyhole size={21} />
              <span>
                <strong>No forced account</strong>
                <small>Use the tools without creating a profile.</small>
              </span>
            </div>

            <div>
              <FileText size={21} />
              <span>
                <strong>No watermark</strong>
                <small>Your document stays your document.</small>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section id="faq" className="faq-section section">
      <div className="section-label">06 / QUESTIONS</div>

      <div className="faq-layout">
        <h2>
          Frequently
          <br />
          <span>asked.</span>
        </h2>

        <div className="faq-list">
          <details>
            <summary>
              Is FreePDF actually free?
              <ChevronDown size={19} />
            </summary>
            <p>
              The goal is to keep the core tools free to use without
              artificial daily limits or forced subscriptions.
            </p>
          </details>

          <details>
            <summary>
              Do I need an account?
              <ChevronDown size={19} />
            </summary>
            <p>
              No account is required for the core experience.
            </p>
          </details>

          <details>
            <summary>
              Will my files be uploaded?
              <ChevronDown size={19} />
            </summary>
            <p>
              Tools can be designed to process files directly in your
              browser whenever technically practical. The exact processing
              method can vary by tool.
            </p>
          </details>

          <details>
            <summary>
              Will there be watermarks?
              <ChevronDown size={19} />
            </summary>
            <p>
              FreePDF is designed without adding promotional watermarks to
              your finished documents.
            </p>
          </details>
        </div>
      </div>
    </section>

    {/* FINAL CTA */}
    <section className="final-section section">
      <div className="final-glow" />
      <div className="final-ring" />

      <div className="section-label">07 / GET STARTED</div>

      <h2>
        Your PDF.
        <br />
        <span>Your way.</span>
      </h2>

      <p>
        Beautifully simple tools for the documents you actually have to
        deal with.
      </p>

      <button className="primary-button huge" onClick={chooseFiles}>
        <Upload size={19} />
        Open FreePDF
        <ArrowRight size={18} />
        <span className="button-shine" />
      </button>
    </section>
  </main>

  <footer className="footer">
    <div className="footer-brand">
      <span className="brand-mark">
        <span />
        <span />
        <span />
      </span>
      <div>
        <strong>FreePDF</strong>
        <span>PDF tools without the nonsense.</span>
      </div>
    </div>

    <div className="footer-links">
      <button onClick={() => scrollTo("tools")}>Tools</button>
      <button onClick={() => scrollTo("privacy")}>Privacy</button>
      <button onClick={() => scrollTo("faq")}>FAQ</button>
    </div>

    <div className="footer-copy">© 2026 FreePDF</div>
  </footer>
</div>


);
}

function formatBytes(bytes) {
if (!bytes) return "0 KB";

const units = ["B", "KB", "MB", "GB"];
const index = Math.floor(Math.log(bytes) / Math.log(1024));

return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${
    units[index]
  }`;
}

function ArrowUpRightIcon() {
return <ArrowDownRight size={17} style={{ transform: "rotate(-45deg)" }} />;
}

function PlusIcon() {
return <ArrowRight size={16} />;
}

export default App;
