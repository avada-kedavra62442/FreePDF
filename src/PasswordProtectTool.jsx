import React, { useEffect, useRef, useState } from "react";
import { createPdfToolkit } from "pdfstudio";

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(190, 218, 205, 0.22)",
  borderRadius: 13,
  background: "rgba(5, 17, 13, 0.72)",
  color: "#e4eee9",
  padding: "13px 14px",
  font: "inherit",
  outline: "none",
};

const secondaryText = {
  color: "rgba(218, 232, 225, 0.68)",
  fontSize: 13,
  lineHeight: 1.65,
};

function readableFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const amount = bytes / Math.pow(1024, index);
  return `${amount.toFixed(index === 0 || amount >= 100 ? 0 : 1)} ${units[index]}`;
}

function safeOutputName(name) {
  const base = (name || "document").replace(/\.pdf$/i, "").trim() || "document";
  return `${base}-protected.pdf`;
}

export default function PasswordProtectTool() {
  const inputRef = useRef(null);
  const toolkitRef = useRef(null);
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result]);

  const clearResult = () => {
    setResult((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const chooseFile = (candidate) => {
    if (!candidate) return;
    setError("");
    clearResult();

    if (candidate.type !== "application/pdf" && !/\.pdf$/i.test(candidate.name || "")) {
      setFile(null);
      setError("Please choose a PDF file.");
      return;
    }

    setFile(candidate);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (busy) return;
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return { score, label: !password ? "Not set" : score <= 2 ? "Could be stronger" : score <= 3 ? "Good" : "Strong" };
  })();

  const protectPDF = async () => {
    if (busy) return;
    setError("");
    clearResult();

    if (!file) {
      setError("Choose a PDF before protecting it.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match. Check both fields and try again.");
      return;
    }

    setBusy(true);
    setProgress("Loading the encryption engine…");

    try {
      if (!toolkitRef.current) {
        toolkitRef.current = await createPdfToolkit();
      }

      setProgress("Encrypting your PDF with AES-256…");
      const protectedBytes = await toolkitRef.current.lock(file, {
        userPassword: password,
        keyLength: 256,
      });

      const blob = new Blob([protectedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResult({
        url,
        filename: safeOutputName(file.name),
        size: blob.size,
      });
      setProgress("");
      setPassword("");
      setConfirmPassword("");
    } catch (protectError) {
      console.error("[FreePDF] Password protection failed:", protectError);
      const message = String(protectError?.message || "").toLowerCase();
      if (message.includes("password") || message.includes("encrypted")) {
        setError("This PDF may already be password-protected. FreePDF couldn't open it for encryption; try an unlocked PDF instead.");
      } else {
        setError("FreePDF couldn't protect this PDF. The file may be damaged or use an unsupported PDF feature. Your original file has not been changed.");
      }
      setProgress("");
    } finally {
      setBusy(false);
    }
  };

  const panelStyle = {
    width: "min(720px, 100%)",
    margin: "26px auto 0",
    padding: "clamp(18px, 4vw, 30px)",
    boxSizing: "border-box",
    border: "1px solid rgba(174, 211, 193, 0.22)",
    borderRadius: 24,
    background: "linear-gradient(145deg, rgba(17, 39, 30, 0.96), rgba(7, 19, 14, 0.97))",
    boxShadow: "0 22px 70px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.035)",
    textAlign: "left",
  };

  const primaryButtonStyle = {
    width: "100%",
    border: "1px solid rgba(205, 235, 220, 0.34)",
    borderRadius: 13,
    padding: "14px 18px",
    background: "linear-gradient(135deg, #b9d7c8, #7ea992)",
    color: "#10241a",
    font: "inherit",
    fontWeight: 800,
    cursor: busy || !file ? "not-allowed" : "pointer",
    opacity: busy || !file ? 0.62 : 1,
    transition: "transform 160ms ease, opacity 160ms ease",
  };

  return (
    <section className="freepdf-password-tool" style={{ width: "100%", maxWidth: 900, margin: "0 auto 70px", padding: "0 20px", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", maxWidth: 650, margin: "0 auto" }}>
        <div className="freepdf-eyebrow">PRIVATE BY DESIGN · AES-256</div>
        <h2 style={{ margin: "12px 0", color: "#e3eee8", fontSize: "clamp(25px, 4vw, 38px)", letterSpacing: "-0.035em" }}>
          Lock your PDF with a password.
        </h2>
        <p style={{ ...secondaryText, maxWidth: 570, margin: "0 auto" }}>
          Add real password encryption before you share a document. Your PDF and password stay in your browser — no file upload to FreePDF servers.
        </p>
      </div>

      <div style={panelStyle}>
        <div
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-label="Choose a PDF file or drop it here"
          onClick={() => !busy && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (!busy && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "20px",
            border: "1px dashed rgba(176, 218, 195, 0.48)",
            borderRadius: 17,
            background: "rgba(117, 165, 138, 0.075)",
            cursor: busy ? "default" : "pointer",
            marginBottom: 24,
          }}
        >
          <div style={{ width: 48, height: 48, flex: "0 0 48px", display: "grid", placeItems: "center", borderRadius: 15, background: "rgba(159, 204, 177, 0.12)", color: "#c3dfcf", fontSize: 24 }}>⇧</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong style={{ display: "block", color: "#e1eee7", overflowWrap: "anywhere" }}>
              {file ? file.name : "Choose a PDF or drop it here"}
            </strong>
            <span style={{ ...secondaryText, display: "block", marginTop: 4 }}>
              {file ? `${readableFileSize(file.size)} · Ready to protect` : "One PDF at a time · Your original stays untouched"}
            </span>
          </div>
          {file && (
            <button
              type="button"
              disabled={busy}
              onClick={(event) => {
                event.stopPropagation();
                setFile(null);
                setError("");
                clearResult();
                if (inputRef.current) inputRef.current.value = "";
              }}
              style={{ border: 0, background: "transparent", color: "#c8ddd1", cursor: "pointer", font: "inherit", padding: 8 }}
            >Remove</button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          disabled={busy}
          onChange={(event) => {
            chooseFile(event.target.files?.[0]);
            event.target.value = "";
          }}
          style={{ display: "none" }}
        />

        <div style={{ display: "grid", gap: 16 }}>
          <label style={{ display: "block", color: "#dce9e2", fontSize: 13, fontWeight: 700 }}>
            New password
            <div style={{ position: "relative", marginTop: 8 }}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                disabled={busy}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                style={{ ...fieldStyle, paddingRight: 82 }}
              />
              <button type="button" disabled={busy} onClick={() => setShowPassword((value) => !value)} style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", border: 0, background: "transparent", color: "#b9d3c5", cursor: "pointer", font: "inherit", fontSize: 12 }}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <label style={{ display: "block", color: "#dce9e2", fontSize: 13, fontWeight: 700 }}>
            Confirm password
            <div style={{ position: "relative", marginTop: 8 }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                disabled={busy}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter the same password again"
                style={{ ...fieldStyle, paddingRight: 82 }}
              />
              <button type="button" disabled={busy} onClick={() => setShowConfirmPassword((value) => !value)} style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", border: 0, background: "transparent", color: "#b9d3c5", cursor: "pointer", font: "inherit", fontSize: 12 }}>
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, ...secondaryText, fontSize: 12 }}>
            <span>Password strength</span>
            <span style={{ color: passwordStrength.score >= 4 ? "#a8d8b8" : "#cbd8d0" }}>{passwordStrength.label}</span>
          </div>
          <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, marginTop: 8 }}>
            {[0, 1, 2, 3, 4].map((index) => (
              <span key={index} style={{ height: 4, borderRadius: 8, background: index < passwordStrength.score ? "#91c6a7" : "rgba(202, 224, 211, 0.12)", transition: "background 160ms ease" }} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 22, padding: "13px 14px", border: "1px solid rgba(175, 211, 192, 0.14)", borderRadius: 13, background: "rgba(2, 12, 8, 0.28)", ...secondaryText }}>
          <strong style={{ color: "#d8e9df" }}>AES-256 encryption</strong>
          <span> · The PDF will require this password to open. Keep it somewhere safe — FreePDF cannot recover a forgotten password.</span>
        </div>

        {error && (
          <div role="alert" style={{ marginTop: 18, padding: "12px 14px", border: "1px solid rgba(244, 145, 145, 0.35)", borderRadius: 12, background: "rgba(112, 31, 31, 0.16)", color: "#ffc6c6", fontSize: 13, lineHeight: 1.6 }}>
            {error}
          </div>
        )}

        {busy && (
          <p role="status" style={{ ...secondaryText, margin: "18px 0 0", textAlign: "center" }}>{progress || "Protecting your PDF…"}</p>
        )}

        <button type="button" disabled={busy || !file} onClick={protectPDF} style={{ ...primaryButtonStyle, marginTop: 22 }}>
          {busy ? "Protecting PDF…" : "Protect PDF with Password"}
        </button>

        {result && (
          <div role="status" style={{ marginTop: 20, padding: 18, border: "1px solid rgba(141, 208, 166, 0.35)", borderRadius: 16, background: "rgba(58, 117, 78, 0.13)" }}>
            <strong style={{ display: "block", color: "#c7ebd2", fontSize: 16 }}>Your PDF is password-protected.</strong>
            <p style={{ ...secondaryText, margin: "6px 0 14px" }}>{result.filename} · {readableFileSize(result.size)}</p>
            <a href={result.url} download={result.filename} style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 11, background: "#b9d7c8", color: "#10241a", fontWeight: 800, fontSize: 13, textDecoration: "none" }}>
              Download protected PDF ↓
            </a>
          </div>
        )}
      </div>

      <p style={{ ...secondaryText, maxWidth: 660, margin: "18px auto 0", textAlign: "center", fontSize: 12 }}>
        Processing happens locally in this browser. The encryption engine may need to download once on first use; your document and password are not uploaded.
      </p>
    </section>
  );
}
