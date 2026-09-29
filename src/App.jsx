import { FileText, ShieldCheck, Zap } from "lucide-react";

function App() {
  return (
    <main className="app">
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <FileText size={22} />
          </div>

          <span>FreePDF</span>
        </div>

        <div className="nav-note">
          Free. Private. No nonsense.
        </div>
      </nav>

      <section className="hero">
        <div className="badge">
          <ShieldCheck size={16} />
          Your files stay in your browser whenever possible
        </div>

        <h1>
          PDF tools.
          <br />
          <span>Actually free.</span>
        </h1>

        <p className="hero-text">
          Merge, split, compress, convert and organize your PDFs
          without ads, watermarks, forced accounts or artificial limits.
        </p>

        <div className="hero-actions">
          <button className="primary-button">
            <FileText size={20} />
            Choose a PDF
          </button>

          <button className="secondary-button">
            Explore tools
          </button>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <ShieldCheck size={25} />
          <h3>Private</h3>
          <p>
            Browser-first processing keeps your files under your control.
          </p>
        </div>

        <div className="feature-card">
          <Zap size={25} />
          <h3>Fast</h3>
          <p>
            Designed to process files directly in your browser whenever possible.
          </p>
        </div>

        <div className="feature-card">
          <FileText size={25} />
          <h3>No nonsense</h3>
          <p>
            No watermark. No forced signup. No annoying upgrade screen.
          </p>
        </div>
      </section>

      <footer>
        <span>FreePDF</span>
        <span>Built for people, not subscriptions.</span>
      </footer>
    </main>
  );
}

export default App;
