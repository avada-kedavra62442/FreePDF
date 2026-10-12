import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function GlassTimePicker({ value, onChange, disabled = false, ariaLabel = "Time" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 16 });
  const timeParts = (value || "").split(":");
  const hasValidTimeParts = timeParts.length === 2 && timeParts.every((part) => part.length === 2 && Number.isFinite(Number(part)));
  const hour = hasValidTimeParts ? Number(timeParts[0]) : 12;
  const minute = hasValidTimeParts ? Number(timeParts[1]) : 0;

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const anchor = triggerRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const width = Math.min(286, window.innerWidth - 32);
      const height = 330;
      setPosition({
        left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
        top: rect.bottom + 8 + height > window.innerHeight
          ? Math.max(12, rect.top - height - 8)
          : rect.bottom + 8,
      });
    };
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target) && !popupRef.current?.contains(event.target)) setOpen(false);
    };
    updatePosition();
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const choose = (h, m) => onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  const optionStyle = (selected) => ({
    minHeight: 34, borderRadius: 8,
    border: selected ? "1px solid rgba(101,244,174,0.72)" : "1px solid rgba(202,219,212,0.10)",
    background: selected ? "linear-gradient(145deg, rgba(47,218,132,0.36), rgba(17,116,72,0.30))" : "rgba(255,255,255,0.035)",
    color: selected ? "#f1fff8" : "#c9dcd3", font: "inherit", fontSize: 12, cursor: "pointer",
  });

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%", zIndex: open ? 2147483000 : 1 }}>
      <button ref={triggerRef} type="button" disabled={disabled} aria-label={ariaLabel}
        aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)}
        style={{
          width: "100%", minHeight: 42, boxSizing: "border-box", padding: "0 11px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          borderRadius: 11, border: open ? "1px solid rgba(83,232,160,0.58)" : "1px solid rgba(202,219,212,0.14)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))",
          color: value ? "#edf6f2" : "rgba(220,240,232,0.42)", outline: "none", font: "inherit", textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
          boxShadow: open ? "0 0 0 3px rgba(48,214,135,0.08)" : "inset 0 1px 0 rgba(255,255,255,0.045)",
        }}>
        <span>{value || "--:--"}</span><span aria-hidden="true" style={{ color: "#82edb2", fontSize: 15 }}>◷</span>
      </button>
      {open && createPortal(
        <div ref={popupRef} role="dialog" aria-label={`${ariaLabel} selector`}
          style={{
            position: "fixed", zIndex: 2147483000, top: position.top, left: position.left,
            width: "min(286px, calc(100vw - 32px))", boxSizing: "border-box", padding: 14,
            border: "1px solid rgba(198,220,211,0.34)", borderRadius: 16,
            background: "linear-gradient(145deg, rgba(21,45,36,0.995) 0%, rgba(10,24,19,0.99) 100%)",
            color: "#edf6f2", boxShadow: "0 24px 70px rgba(0,0,0,0.72), 0 0 0 1px rgba(101,244,174,0.08)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <strong style={{ fontSize: 13, letterSpacing: "0.04em" }}>SELECT TIME</strong>
            <span style={{ color: "#82edb2", fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{value || "--:--"}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { key: "hour", label: "HOUR", values: Array.from({ length: 24 }, (_, i) => i), selected: hour },
              { key: "minute", label: "MINUTE", values: Array.from({ length: 60 }, (_, i) => i), selected: minute },
            ].map((column) => (
              <div key={column.key} style={{ minWidth: 0 }}>
                <div style={{ textAlign: "center", marginBottom: 8, color: "#82edb2", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em" }}>{column.label}</div>
                <div style={{ height: 190, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 4, paddingRight: 2 }}>
                  {column.values.map((number) => {
                    const selected = number === column.selected;
                    return <button key={number} type="button" aria-pressed={selected}
                      onClick={() => choose(column.key === "hour" ? number : hour, column.key === "minute" ? number : minute)}
                      style={optionStyle(selected)}>{String(number).padStart(2, "0")}</button>;
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => { onChange(""); setOpen(false); }} style={{ ...optionStyle(false), padding: "0 12px" }}>Clear</button>
            <button type="button" onClick={() => setOpen(false)} style={{ ...optionStyle(true), padding: "0 14px" }}>Done</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


