import { useState, useEffect } from "react";
import { DAYS } from "../constants/index.js";
import { storage } from "../utils/storage.js";
import { getWeekNumber, getMondayOfWeek, toDateKey } from "../utils/dateUtils.js";

const EMPTY = { counts: {} };
const NOW_WEEK = getWeekNumber(new Date());
const NOW_YEAR = new Date().getFullYear();

function datesForWeek(year, weekNum) {
  const monday = getMondayOfWeek(year, weekNum);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function BeslutTable({ t, weekNum, year }) {
  const [data, setData] = useState(EMPTY);
  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const unsub = storage.subscribe("beslut-overview", (r) => {
      setData(r ? { ...EMPTY, ...JSON.parse(r.value) } : EMPTY);
    });
    return () => unsub();
  }, []);

  function save(updated) {
    storage.set("beslut-overview", JSON.stringify(updated));
  }

  function startEdit(key, currentCount) {
    setEditCell(key);
    setEditValue(currentCount > 0 ? String(currentCount) : "");
  }

  function confirmEdit(key) {
    const v = Math.max(0, parseInt(editValue) || 0);
    const counts = { ...data.counts };
    if (v === 0) delete counts[key];
    else counts[key] = v;
    const updated = { ...data, counts };
    setData(updated);
    save(updated);
    setEditCell(null);
  }

  const rows = [
    { offset: -1, label: "Förra v." },
    { offset:  0, label: "Denna v." },
    { offset: +1, label: "Nästa v." },
    { offset: +2, label: ""  },
  ];

  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "14px 18px", marginTop: "14px" }}>
      <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: t.textFaint, fontWeight: 600, marginBottom: "12px" }}>
        Beslutsöversikt
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", color: t.textMuted, fontWeight: 600, borderBottom: `1px solid ${t.border}`, background: t.cardAlt, minWidth: "90px" }}>
                Vecka
              </th>
              {DAYS.map((d) => (
                <th key={d} style={{ padding: "8px 10px", textAlign: "center", fontSize: "12px", color: t.textMuted, fontWeight: 600, borderBottom: `1px solid ${t.border}`, background: t.cardAlt }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ offset, label }) => {
              let wn = weekNum + offset;
              let wy = year;
              if (wn <= 0)  { wn += 52; wy -= 1; }
              if (wn >= 53) { wn -= 52; wy += 1; }
              const dates = datesForWeek(wy, wn);
              const isCurrent = wn === NOW_WEEK && wy === NOW_YEAR;
              return (
                <tr key={offset}>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${t.borderLight}`, background: t.cardAlt }}>
                    <div style={{ fontSize: "12px", color: t.textMuted, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: "11px", color: isCurrent ? t.accent : t.textFaint, fontWeight: isCurrent ? 700 : 400 }}>
                      v.{wn}{isCurrent ? " (nu)" : ""}
                    </div>
                  </td>
                  {dates.map((date) => {
                    const key = toDateKey(date);
                    const count = data.counts[key] || 0;
                    const isEditing = editCell === key;
                    return (
                      <td key={key} style={{ padding: "8px 6px", textAlign: "center", borderBottom: `1px solid ${t.borderLight}`, minWidth: "70px" }}>
                        <div style={{ fontSize: "11px", color: t.textFaint, marginBottom: "4px" }}>
                          {date.getDate()}e
                        </div>
                        {isEditing ? (
                          <input
                            type="number" min="0" value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmEdit(key);
                              if (e.key === "Escape") setEditCell(null);
                            }}
                            onBlur={() => confirmEdit(key)}
                            autoFocus
                            style={{ width: "52px", padding: "4px 6px", fontSize: "15px", fontWeight: 700, textAlign: "center", background: t.input, border: `1px solid ${t.accent}`, borderRadius: "6px", color: t.textStrong, outline: "none" }}
                          />
                        ) : (
                          <div
                            onClick={() => startEdit(key, count)}
                            title="Klicka för att redigera"
                            style={{ fontSize: "16px", fontWeight: 700, color: count > 0 ? t.accent : t.textFaint, cursor: "pointer", padding: "4px 8px", borderRadius: "6px", display: "inline-block", minWidth: "44px", border: "1px solid transparent", transition: "border-color 0.15s" }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = t.inputBorder}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                          >
                            {count > 0 ? `${count}st` : "—"}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
