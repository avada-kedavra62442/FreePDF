import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function InstallFreePDF() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setInstalled(standalone);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (installed) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;

      if (result.outcome === "accepted") {
        setInstalled(true);
      }

      setDeferredPrompt(null);
      return;
    }

    setHelpOpen(true);
  };

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        className="secondary-button"
        onClick={install}
        title="Install FreePDF as an app"
      >
        <span>Install FreePDF</span>
        <span>＋</span>
      </button>

      {helpOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install FreePDF"
          onClick={(event) => {
            if (event.target === event.currentTarget) setHelpOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "rgba(0,0,0,0.68)",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "min(520px, 100%)",
              padding: "30px 28px",
              borderRadius: 24,
              background: "linear-gradient(145deg, #182b25 0%, #0d1a16 100%)",
              border: "1px solid rgba(167,221,199,0.22)",
              boxShadow: "0 28px 80px rgba(0,0,0,0.5), 0 0 40px rgba(38,209,126,0.10)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
              <div>
                <span className="section-kicker">INSTALL FREEPDF</span>
                <h3 style={{ margin: "10px 0 8px", fontSize: 28 }}>Make FreePDF an app.</h3>
              </div>

              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Close install instructions"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid rgba(202,219,212,0.14)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#edf6f2",
                  cursor: "pointer",
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>

            {isIOS ? (
              <p style={{ margin: "18px 0 0", lineHeight: 1.75, opacity: 0.78 }}>
                In Safari, tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong> and confirm. FreePDF will open from your Home Screen like an app.
              </p>
            ) : (
              <p style={{ margin: "18px 0 0", lineHeight: 1.75, opacity: 0.78 }}>
                Your browser does not currently expose the one-tap install prompt. Open the browser menu and choose <strong>Install FreePDF</strong>, <strong>Install app</strong>, or <strong>Add to Home screen</strong>.
              </p>
            )}

            <button
              type="button"
              className="primary-button"
              onClick={() => setHelpOpen(false)}
              style={{ marginTop: 24 }}
            >
              Got it
              <span>✓</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
