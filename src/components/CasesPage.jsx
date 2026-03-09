import { useState, useEffect } from "react";
import { DAYS_LONG, CATEGORIES } from "../constants/index.js";
import { makeEmptyWeek, makeEmptyGoals } from "../utils/dataUtils.js";

export default function CasesPage({ weekNum, year, isAdmin, flashSaved, s, t }) {
  const [weekData, setWeekData] = useState(makeEmptyWeek());
  const [goals, setGoals] = useState(makeEmptyGoals());
  const [loading, setLoading] = useState(true);
  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editGoal, setEditGoal] = useState(null);
  const [editGoalValue, setEditGoalValue] = useState("");

  useEffect(() => { loadData(); }, [weekNum, year]);

  async function loadData() {
    setLoading(true);
    let d = makeEmptyWeek(), g = makeEmptyGoals();
    try { let r = await window.storage.get(`y${year}-week-${weekNum}`, true); d = JSON.parse(r.value); } catch (e) {}
    try { let r = await window.storage.get(`y${year}-goals-${weekNum}`, true); g = JSON.parse(r.value); } catch (e) {}
    setWeekData(d); setGoals(g); setLoading(false);
  }

  async function saveWeek(data) { try { await window.storage.set(`y${year}-week-${weekNum}`, JSON.stringify(data), true); flashSaved(); } catch (e) {} }
  async function saveGoals(g) { try { await window.storage.set(`y${year}-goals-${weekNum}`, JSON.stringify(g), true); flashSaved(); } catch (e) {} }

  function handleAdjust(day, cat, amt) {
    let u = { ...weekData }; u[day] = { ...u[day] };
    let v = (u[day][cat] || 0) + amt; if (v < 0) v = 0;
    u[day][cat] = v; setWeekData(u); saveWeek(u);
  }
  function startEdit(day, cat) { if (!isAdmin) return; setEditCell({ day, cat }); setEditValue(String(weekData[day][cat])); }
  function confirmEdit() {
    if (!editCell) return; let v = parseInt(editValue); if (isNaN(v) || v < 0) v = 0;
    let u = { ...weekData }; u[editCell.day] = { ...u[editCell.day] }; u[editCell.day][editCell.cat] = v;
    setWeekData(u); saveWeek(u); setEditCell(null);
  }
  function startGoalEdit(cat) { if (!isAdmin) return; setEditGoal(cat); setEditGoalValue(String(goals[cat] || 0)); }
  function confirmGoalEdit() {
    if (!editGoal) return; let v = parseInt(editGoalValue); if (isNaN(v) || v < 0) v = 0;
    let u = { ...goals, [editGoal]: v }; setGoals(u); saveGoals(u); setEditGoal(null);
  }

  function catTotal(cat) { return DAYS_LONG.reduce((s, d) => s + (weekData[d]?.[cat] || 0), 0); }
  function dayTotal(day) { return CATEGORIES.reduce((s, c) => s + (weekData[day]?.[c] || 0), 0); }
  function grandTotal() { return DAYS_LONG.reduce((s, d) => s + dayTotal(d), 0); }
  function getProgress(cat) { let g = goals[cat] || 0; if (g === 0) return null; return Math.min(100, Math.round((catTotal(cat) / g) * 100)); }

  if (loading) return <p style={{ textAlign: "center", color: t.textMuted, padding: "40px" }}>Laddar...</p>;

  return (
    <>
      {/* goals */}
      <div style={s.goalsBar}>
        <div style={s.goalsTitle}>Veckomål</div>
        <div style={s.goalsRow}>
          {CATEGORIES.map((cat) => {
            let goal = goals[cat] || 0, done = catTotal(cat), pct = getProgress(cat), reached = pct !== null && pct >= 100;
            return (
              <div key={cat} style={s.goalCard}>
                <div style={s.goalCatName}>{cat}</div>
                <div style={s.goalNumbers}>
                  <span style={{ color: reached ? t.green : t.textStrong, fontWeight: 700, fontSize: "20px" }}>{done}</span>
                  <span style={{ color: t.textFaint, margin: "0 4px" }}>/</span>
                  {editGoal === cat ? (
                    <input type="number" min="0" value={editGoalValue}
                      onChange={(e) => setEditGoalValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") confirmGoalEdit(); if (e.key === "Escape") setEditGoal(null); }}
                      onBlur={confirmGoalEdit} autoFocus style={s.goalInput} />
                  ) : (
                    <span style={{ color: t.textMuted, fontSize: "20px", cursor: isAdmin ? "pointer" : "default", borderBottom: isAdmin ? `1px dashed ${t.textFaint}` : "none" }}
                      onClick={() => startGoalEdit(cat)} title={isAdmin ? "Klicka för att ändra mål" : ""}>{goal || "–"}</span>
                  )}
                </div>
                {goal > 0 && (
                  <div style={s.progressBg}>
                    <div style={{ ...s.progressFill, width: `${pct}%`, background: reached ? `linear-gradient(90deg,${t.green},${t.green})` : `linear-gradient(90deg,#3b5bdb,${t.accent})` }} />
                  </div>
                )}
                {goal > 0 && <div style={{ fontSize: "11px", color: reached ? t.green : t.textFaint, marginTop: "4px" }}>{reached ? "✓ Mål uppnått!" : `${pct}% — ${goal - done} kvar`}</div>}
                {goal === 0 && isAdmin && <div style={{ fontSize: "11px", color: t.textFaint, marginTop: "6px" }}>Klicka – för att sätta mål</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, textAlign: "left" }}>Dag</th>
              {CATEGORIES.map((c) => <th key={c} style={s.th}>{c}</th>)}
              <th style={{ ...s.th, color: t.accent }}>Totalt</th>
            </tr>
          </thead>
          <tbody>
            {DAYS_LONG.map((day) => (
              <tr key={day}>
                <td style={s.dayCell}>{day}</td>
                {CATEGORIES.map((cat) => {
                  let editing = editCell && editCell.day === day && editCell.cat === cat;
                  let val = weekData[day]?.[cat] || 0;
                  return (
                    <td key={cat} style={s.cell}>
                      {editing ? (
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <input type="number" min="0" value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") setEditCell(null); }}
                            onBlur={confirmEdit} autoFocus style={s.editInput} />
                        </div>
                      ) : (
                        <div style={s.cellInner}>
                          <button style={s.minusBtn} onClick={() => handleAdjust(day, cat, -1)}>−</button>
                          <span style={{ fontSize: "16px", fontWeight: 700, color: t.textStrong, minWidth: "28px", textAlign: "center", cursor: isAdmin ? "pointer" : "default", borderBottom: isAdmin ? `1px dashed ${t.textFaint}` : "none" }}
                            onClick={() => startEdit(day, cat)} title={isAdmin ? "Redigera" : ""}>{val}</span>
                          <button style={s.plusBtn} onClick={() => handleAdjust(day, cat, 1)}>+</button>
                        </div>
                      )}
                    </td>
                  );
                })}
                <td style={s.totalCell}>{dayTotal(day)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={s.footLabel}>Totalt</td>
              {CATEGORIES.map((c) => <td key={c} style={s.footCell}>{catTotal(c)}</td>)}
              <td style={s.grandCell}>{grandTotal()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
