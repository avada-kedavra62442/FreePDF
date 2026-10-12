import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function GlassDatePicker({
  value,
  onChange,
  disabled = false,
  ariaLabel = "Date",
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (!value) return new Date();
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  });

  const pickerRef = useRef(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const [popupPosition, setPopupPosition] = useState({
    top: 0,
    left: 20,
  });

  useEffect(() => {
    if (!open) return;

    const updatePopupPosition = () => {
      const anchor = triggerRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const popupWidth = Math.min(318, window.innerWidth - 40);
      const popupHeight = 360;
      const left = Math.max(
        20,
        Math.min(rect.left, window.innerWidth - popupWidth - 20)
      );
      const top =
        rect.bottom + 9 + popupHeight > window.innerHeight
          ? Math.max(12, rect.top - popupHeight - 9)
          : rect.bottom + 9;

      setPopupPosition({ top, left });
    };

    const handlePointerDown = (event) => {
      if (
        !pickerRef.current?.contains(event.target) &&
        !popupRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    updatePopupPosition();
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!value) return;

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (!Number.isNaN(date.getTime())) {
      setViewDate(date);
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = viewDate.toLocaleString(undefined, {
    month: "long",
  });

  const selectedParts = value
    ? value.split("-").map(Number)
    : null;

  const selectedDate =
    selectedParts?.length === 3
      ? {
          year: selectedParts[0],
          month: selectedParts[1] - 1,
          day: selectedParts[2],
        }
      : null;

  const pad = (number) =>
    String(number).padStart(2, "0");

  const emitDate = (day) => {
    const nextValue = `${year}-${pad(month + 1)}-${pad(day)}`;
    onChange(nextValue);
    setOpen(false);
  };

  const shiftMonth = (amount) => {
    setViewDate(
      new Date(
        year,
        month + amount,
        1
      )
    );
  };

  const clearDate = () => {
    onChange("");
    setOpen(false);
  };

  const today = new Date();
  const weeks = [];
  let cells = Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);

    if (cells.length === 7) {
      weeks.push(cells);
      cells = [];
    }
  }

  while (cells.length && cells.length < 7) {
    cells.push(null);
  }

  if (cells.length) {
    weeks.push(cells);
  }

  const displayValue = value
    ? (() => {
        const [y, m, d] = value.split("-").map(Number);
        if (!y || !m || !d) return value;
        return new Date(y, m - 1, d).toLocaleDateString(
          undefined,
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );
      })()
    : "Choose a date";

  return (
    <div
      ref={pickerRef}
      style={{
        position: "relative",
        zIndex: open ? 2147483000 : 1,
        width: "100%",
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        style={{
          width: "100%",
          minHeight: 42,
          boxSizing: "border-box",
          padding: "0 12px",
          borderRadius: 11,
          border: open
            ? "1px solid rgba(83, 232, 160, 0.58)"
            : "1px solid rgba(202,219,212,0.14)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))",
          color: value
            ? "#edf6f2"
            : "rgba(220,240,232,0.42)",
          outline: "none",
          font: "inherit",
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: open
            ? "0 0 0 3px rgba(48, 214, 135, 0.08), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "inset 0 1px 0 rgba(255,255,255,0.045)",
          transition:
            "border-color 160ms ease, box-shadow 160ms ease, background 160ms ease",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span>{displayValue}</span>

          <span
            aria-hidden="true"
            style={{
              width: 24,
              height: 24,
              display: "grid",
              placeItems: "center",
              borderRadius: 7,
              border:
                "1px solid rgba(202,219,212,0.12)",
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.025))",
              color: "#72e9ac",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.08)",
              fontSize: 13,
            }}
          >
            ▣
          </span>
        </span>
      </button>

      {open && createPortal(
        <div
          ref={popupRef}
          role="dialog"
          aria-label={`${ariaLabel} calendar`}
          style={{
            position: "fixed",
            zIndex: 2147483000,
            top: popupPosition.top,
            left: popupPosition.left,
            width: "min(318px, calc(100vw - 40px))",
            padding: 14,
            borderRadius: 17,
            border:
              "1px solid rgba(198, 220, 211, 0.34)",
            background:
              "linear-gradient(145deg, rgba(21, 45, 36, 0.99) 0%, rgba(10, 24, 19, 0.985) 100%)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            boxShadow:
              "0 28px 65px rgba(0,0,0,0.62), 0 0 38px rgba(38,209,126,0.16), inset 0 1px 0 rgba(225,245,236,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 850,
                  letterSpacing: "0.01em",
                  color: "#edf6f2",
                }}
              >
                {monthName}
              </div>

              <div
                style={{
                  marginTop: 2,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.13em",
                  textTransform: "uppercase",
                  color: "rgba(180, 214, 202, 0.46)",
                }}
              >
                {year}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 6,
              }}
            >
              {[
                ["Previous month", "‹", -1],
                ["Next month", "›", 1],
              ].map(([label, icon, amount]) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  onClick={() => shiftMonth(amount)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    border:
                      "1px solid rgba(202,219,212,0.13)",
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.085), rgba(255,255,255,0.025))",
                    color: "#bfe7d4",
                    fontSize: 20,
                    lineHeight: 1,
                    cursor: "pointer",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.07)",
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(7, minmax(0, 1fr))",
              gap: 4,
              marginBottom: 5,
            }}
          >
            {["S", "M", "T", "W", "T", "F", "S"].map(
              (day, index) => (
                <div
                  key={`${day}-${index}`}
                  style={{
                    height: 25,
                    display: "grid",
                    placeItems: "center",
                    color:
                      "rgba(182, 218, 203, 0.42)",
                    fontSize: 9,
                    fontWeight: 850,
                    letterSpacing: "0.06em",
                  }}
                >
                  {day}
                </div>
              )
            )}
          </div>

          <div
            style={{
              display: "grid",
              gap: 4,
            }}
          >
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(7, minmax(0, 1fr))",
                  gap: 4,
                }}
              >
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return (
                      <span
                        key={`empty-${dayIndex}`}
                        style={{ height: 32 }}
                      />
                    );
                  }

                  const isSelected =
                    selectedDate &&
                    selectedDate.year === year &&
                    selectedDate.month === month &&
                    selectedDate.day === day;

                  const isToday =
                    today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === day;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => emitDate(day)}
                      style={{
                        height: 32,
                        borderRadius: 9,
                        border: isSelected
                          ? "1px solid rgba(101, 244, 174, 0.78)"
                          : isToday
                          ? "1px solid rgba(101, 244, 174, 0.30)"
                          : "1px solid transparent",
                        background: isSelected
                          ? "linear-gradient(145deg, rgba(47, 218, 132, 0.42), rgba(17, 116, 72, 0.34))"
                          : isToday
                          ? "rgba(50, 200, 126, 0.10)"
                          : "rgba(255,255,255,0.018)",
                        color: isSelected
                          ? "#f1fff8"
                          : isToday
                          ? "#82edb2"
                          : "#c9ddd5",
                        fontSize: 11,
                        fontWeight: isSelected
                          ? 850
                          : 650,
                        cursor: "pointer",
                        boxShadow: isSelected
                          ? "0 0 16px rgba(47, 218, 132, 0.16), inset 0 1px 0 rgba(255,255,255,0.10)"
                          : "inset 0 1px 0 rgba(255,255,255,0.025)",
                        transition:
                          "transform 120ms ease, background 120ms ease, border-color 120ms ease",
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginTop: 12,
              paddingTop: 10,
              borderTop:
                "1px solid rgba(202,219,212,0.09)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setViewDate(
                  new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                  )
                );
              }}
              style={{
                border: 0,
                background: "transparent",
                color: "#72e9ac",
                fontSize: 10,
                fontWeight: 800,
                cursor: "pointer",
                padding: "5px 2px",
              }}
            >
              Today
            </button>

            <button
              type="button"
              onClick={clearDate}
              style={{
                border: 0,
                background: "transparent",
                color: "rgba(210,225,219,0.48)",
                fontSize: 10,
                fontWeight: 750,
                cursor: "pointer",
                padding: "5px 2px",
              }}
            >
              Clear
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   Component
------------------------------------------------------------ */
