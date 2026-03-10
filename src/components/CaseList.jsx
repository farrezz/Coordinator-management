import { useState, useEffect } from "react";
import { CASE_TYPES } from "../constants/index.js";
import { storage } from "../utils/storage.js";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export default function CaseList({ s, t }) {
  const [cases, setCases] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState(CASE_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const unsub = storage.subscribe("case-list", (r) => {
      setCases(r ? JSON.parse(r.value) : []);
    });
    return () => unsub();
  }, []);

  function save(updated) {
    storage.set("case-list", JSON.stringify(updated));
  }

  function addCase() {
    const type = newType === "Annan" ? customType.trim() : newType;
    if (!type || !newDate) return;
    const updated = [...cases, { id: String(Date.now() + Math.random()), type, date: newDate, note: newNote.trim(), done: false }];
    save(updated);
    setNewType(CASE_TYPES[0]); setCustomType(""); setNewDate(""); setNewNote(""); setShowForm(false);
  }

  function toggleDone(id) {
    const updated = cases.map((c) => c.id === id ? { ...c, done: !c.done } : c);
    save(updated);
  }

  function deleteCase(id) {
    save(cases.filter((c) => c.id !== id));
  }

  const open = cases.filter((c) => !c.done).sort((a, b) => a.date.localeCompare(b.date));
  const done = cases.filter((c) => c.done).sort((a, b) => a.date.localeCompare(b.date));
  const sorted = [...open, ...done];

  // Count open cases per type
  const typeCounts = {};
  open.forEach((c) => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });
  const countedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "14px 18px", marginTop: "14px" }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: t.textFaint, fontWeight: 600 }}>Ärendelista</span>
        <button style={{ padding: "5px 12px", borderRadius: "7px", border: `1px solid ${t.inputBorder}`, background: t.accentBg, color: t.accent, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          onClick={() => setShowForm((v) => !v)}>{showForm ? "Avbryt" : "+ Lägg till"}</button>
      </div>

      {/* summary bar */}
      {countedTypes.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          {countedTypes.map(([type, count]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: "6px", background: t.cardAlt, border: `1px solid ${t.borderLight}`, borderRadius: "8px", padding: "5px 10px" }}>
              <span style={{ fontSize: "12px", color: t.textMuted }}>{type}</span>
              <span style={{ fontSize: "15px", fontWeight: 700, color: t.accent }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* add form */}
      {showForm && (
        <div style={{ background: t.cardAlt, border: `1px solid ${t.borderLight}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px" }}>
              <div style={{ fontSize: "11px", color: t.textFaint, marginBottom: "4px" }}>Typ</div>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} style={s.selectInput}>
                {CASE_TYPES.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
                <option value="Annan">Annan…</option>
              </select>
            </div>
            <div style={{ flex: "0 0 140px" }}>
              <div style={{ fontSize: "11px", color: t.textFaint, marginBottom: "4px" }}>Datum</div>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={s.textInput} />
            </div>
          </div>
          {newType === "Annan" && (
            <input type="text" placeholder="Ange typ..." value={customType} onChange={(e) => setCustomType(e.target.value)} style={s.textInput} />
          )}
          <input type="text" placeholder="Anteckning (valfritt)" value={newNote} onChange={(e) => setNewNote(e.target.value)} style={s.textInput} />
          <button onClick={addCase} style={{ alignSelf: "flex-start", padding: "7px 16px", borderRadius: "8px", border: "none", background: t.accent, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            Lägg till ärende
          </button>
        </div>
      )}

      {/* case list */}
      {sorted.length === 0 ? (
        <p style={{ color: t.textFaint, fontSize: "13px", textAlign: "center", padding: "16px 0", margin: 0 }}>Inga ärenden ännu.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {sorted.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 10px", borderRadius: "8px", background: c.done ? t.cardAlt : t.input, border: `1px solid ${t.borderLight}`, opacity: c.done ? 0.5 : 1 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: t.accent, whiteSpace: "nowrap" }}>{formatDate(c.date)}</span>
                  <span style={{ fontSize: "13px", color: c.done ? t.textMuted : t.textStrong, textDecoration: c.done ? "line-through" : "none" }}>{c.type}</span>
                </div>
                {c.note && <div style={{ fontSize: "12px", color: t.textFaint, marginTop: "2px" }}>{c.note}</div>}
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button onClick={() => toggleDone(c.id)} title={c.done ? "Markera som öppen" : "Markera som klar"}
                  style={{ padding: "4px 8px", borderRadius: "5px", border: `1px solid ${c.done ? t.inputBorder : t.greenBorder}`, background: c.done ? t.input : t.greenBg, color: c.done ? t.textMuted : t.green, fontSize: "13px", cursor: "pointer", fontWeight: 700 }}>
                  {c.done ? "↺" : "✓"}
                </button>
                <button onClick={() => deleteCase(c.id)} title="Ta bort"
                  style={{ padding: "4px 8px", borderRadius: "5px", border: `1px solid ${t.dangerBorder}`, background: t.dangerBg, color: t.red, fontSize: "13px", cursor: "pointer", fontWeight: 700 }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
