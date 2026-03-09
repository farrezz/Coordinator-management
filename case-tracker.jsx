import { useState, useEffect } from "react";

// --- CONFIG ---
const ADMIN_PIN = "1234";

function getWeekNumber(date) {
  let d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  let week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

const DAYS = ["Mån", "Tis", "Ons", "Tor", "Fre"];
const DAYS_LONG = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];
const CATEGORIES = ["Beredningar", "IA", "IA med Kandidater"];
const NOW_WEEK = getWeekNumber(new Date());
const NOW_YEAR = new Date().getFullYear();

const ABSENCE_TYPES = {
  none: { label: "–", color: "transparent", text: "#666" },
  semester: { label: "Semester", color: "#dc2626", text: "#fff" },
  sjuk: { label: "Sjuk", color: "#eab308", text: "#000" },
  vab: { label: "VAB", color: "#e67e22", text: "#fff" },
  annan: { label: "Annan", color: "#7c3aed", text: "#fff" },
};

// --- THEMES ---
const themes = {
  dark: {
    bg: "#0f1117", card: "#1a1d27", cardAlt: "#15171f", border: "#2a2d3a",
    borderLight: "#1f2230", text: "#e0e0e0", textStrong: "#fff", textMuted: "#888",
    textFaint: "#555", accent: "#5b7fff", accentBg: "#1a2040", accentBorder: "#333a5f",
    input: "#23263a", inputBorder: "#333654", green: "#4ade80", greenBg: "#152a1a",
    greenBorder: "#1a3a2a", red: "#f87171", redBg: "#2a1520", redBorder: "#3a2030",
    gold: "#f0c060", goldBg: "#2a1f10", goldBorder: "#5a4020", taskBg: "#151830",
    dangerBg: "#3a1515", dangerBorder: "#5a2020",
  },
  light: {
    bg: "#f0f2f5", card: "#ffffff", cardAlt: "#f8f9fb", border: "#dde1e8",
    borderLight: "#eaedf2", text: "#334155", textStrong: "#0f172a", textMuted: "#64748b",
    textFaint: "#94a3b8", accent: "#3b5bdb", accentBg: "#eef1ff", accentBorder: "#b4c2f7",
    input: "#f1f3f8", inputBorder: "#d0d5e0", green: "#16a34a", greenBg: "#ecfdf5",
    greenBorder: "#a7f3d0", red: "#dc2626", redBg: "#fef2f2", redBorder: "#fecaca",
    gold: "#b45309", goldBg: "#fffbeb", goldBorder: "#fde68a", taskBg: "#eef1ff",
    dangerBg: "#fef2f2", dangerBorder: "#fecaca",
  },
};

function makeEmptyWeek() {
  let d = {};
  DAYS_LONG.forEach((day) => { d[day] = {}; CATEGORIES.forEach((c) => { d[day][c] = 0; }); });
  return d;
}
function makeEmptyGoals() {
  let g = {};
  CATEGORIES.forEach((c) => { g[c] = 0; });
  return g;
}

function defaultScheduleConfig() {
  return {
    groups: [
      { name: "Grupp 1", members: ["Liudmyla", "Vivian", "Robin", "Marie"], fixedTask: null },
      { name: "Grupp 2", members: ["Farhad", "Sandra", "Aleksandra", "Ulrika"], fixedTask: null },
      { name: "Grupp 3", members: ["Anas", "Isabella", "Aseel", "Viola"], fixedTask: null },
      { name: "Grupp A", members: ["Sara", "Roshanak", "Zeinab"], fixedTask: "Månadsskifte" },
      { name: "Grupp D", members: ["Minire"], fixedTask: "Onboarding" },
    ],
    rotatingTasks: ["Sammanställning + rekrytera 16 + Behov", "Beslut", "Beredning"],
    roles: { Chef: "Cecilia", Skydd: "Sara", Samordnare: "Farrelissa" },
    baseWeek: NOW_WEEK, baseYear: NOW_YEAR,
  };
}

// helper to build styles from theme
function T(theme) {
  let t = themes[theme];
  return {
    page: { minHeight: "100vh", background: t.bg, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: t.text, display: "flex", justifyContent: "center", padding: "20px 12px", transition: "background 0.3s, color 0.3s" },
    container: { width: "100%", maxWidth: "900px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" },
    title: { fontSize: "20px", margin: 0, fontWeight: 700, color: t.textStrong },
    tabs: { display: "flex", gap: "4px" },
    tab: { padding: "6px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.card, color: t.textMuted, fontSize: "13px", cursor: "pointer", fontWeight: 500 },
    tabActive: { padding: "6px 14px", borderRadius: "8px", border: `1px solid ${t.accent}`, background: t.accentBg, color: t.accent, fontSize: "13px", cursor: "pointer", fontWeight: 600 },
    adminBadge: { fontSize: "11px", background: t.goldBg, padding: "3px 8px", borderRadius: "20px", border: `1px solid ${t.goldBorder}`, color: t.gold },
    linkBtn: { fontSize: "11px", background: "none", border: "none", color: t.accent, cursor: "pointer", textDecoration: "underline", padding: 0 },
    themeBtn: { background: t.card, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "14px", lineHeight: 1 },
    weekPicker: { display: "flex", alignItems: "center", gap: "6px" },
    arrowBtn: { background: t.input, border: `1px solid ${t.inputBorder}`, color: t.textMuted, width: "32px", height: "32px", borderRadius: "6px", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
    yearSelect: { fontSize: "14px", fontWeight: 600, color: t.textMuted, background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: "6px", padding: "5px 6px", cursor: "pointer", outline: "none" },
    weekSelect: { fontSize: "16px", fontWeight: 700, color: t.textStrong, background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: "6px", padding: "5px 8px", cursor: "pointer", outline: "none" },
    overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modal: { background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "24px 28px", minWidth: "280px", textAlign: "center" },
    pinInput: { width: "100%", padding: "10px 14px", fontSize: "18px", background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: "8px", color: t.textStrong, textAlign: "center", outline: "none", letterSpacing: "6px", boxSizing: "border-box" },
    textInput: { width: "100%", padding: "8px 12px", fontSize: "14px", background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: "8px", color: t.textStrong, outline: "none", boxSizing: "border-box" },
    selectInput: { width: "100%", padding: "8px 12px", fontSize: "14px", background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: "8px", color: t.textStrong, outline: "none", boxSizing: "border-box" },
    pinErr: { color: t.red, fontSize: "13px", margin: "8px 0 0 0" },
    modalBtnCancel: { flex: 1, padding: "9px", background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: "8px", color: t.textMuted, fontSize: "13px", cursor: "pointer" },
    modalBtnOk: { flex: 1, padding: "9px", background: t.accent, border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    savedMsg: { textAlign: "center", color: t.green, fontSize: "13px", marginBottom: "8px", fontWeight: 600 },
    // cases
    goalsBar: { background: t.card, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "14px 18px", marginBottom: "14px" },
    goalsTitle: { fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: t.textFaint, marginBottom: "10px", fontWeight: 600 },
    goalsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" },
    goalCard: { background: t.cardAlt, borderRadius: "10px", padding: "12px", textAlign: "center", border: `1px solid ${t.borderLight}` },
    goalCatName: { fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" },
    goalNumbers: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: "2px" },
    goalInput: { width: "50px", padding: "2px 6px", fontSize: "18px", fontWeight: 700, textAlign: "center", background: t.input, border: `1px solid ${t.accent}`, borderRadius: "6px", color: t.textStrong, outline: "none" },
    progressBg: { width: "100%", height: "4px", background: t.borderLight, borderRadius: "2px", marginTop: "6px", overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: "2px", transition: "width 0.4s ease" },
    tableWrap: { overflowX: "auto", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.card },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
    th: { padding: "10px 12px", textAlign: "center", fontWeight: 600, color: t.textMuted, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${t.border}`, background: t.cardAlt },
    dayCell: { padding: "10px 12px", fontWeight: 600, color: t.textMuted, borderBottom: `1px solid ${t.borderLight}` },
    cell: { padding: "6px 4px", textAlign: "center", borderBottom: `1px solid ${t.borderLight}` },
    cellInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" },
    minusBtn: { width: "26px", height: "26px", borderRadius: "5px", border: `1px solid ${t.redBorder}`, background: t.redBg, color: t.red, fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
    plusBtn: { width: "26px", height: "26px", borderRadius: "5px", border: `1px solid ${t.greenBorder}`, background: t.greenBg, color: t.green, fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
    editInput: { width: "52px", padding: "4px 6px", fontSize: "15px", fontWeight: 700, textAlign: "center", background: t.input, border: `1px solid ${t.accent}`, borderRadius: "6px", color: t.textStrong, outline: "none" },
    totalCell: { padding: "10px 12px", textAlign: "center", fontWeight: 700, color: t.accent, fontSize: "15px", borderBottom: `1px solid ${t.borderLight}` },
    footLabel: { padding: "10px 12px", fontWeight: 700, color: t.textMuted, fontSize: "11px", textTransform: "uppercase", borderTop: `1px solid ${t.border}`, background: t.cardAlt },
    footCell: { padding: "10px 12px", textAlign: "center", fontWeight: 700, color: t.text, fontSize: "14px", borderTop: `1px solid ${t.border}`, background: t.cardAlt },
    grandCell: { padding: "10px 12px", textAlign: "center", fontWeight: 700, color: t.accent, fontSize: "15px", borderTop: `1px solid ${t.border}`, background: t.cardAlt },
    // schedule
    requestsBar: { background: t.goldBg, border: `1px solid ${t.goldBorder}`, borderRadius: "12px", padding: "12px 16px", marginBottom: "12px" },
    requestRow: { display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderTop: `1px solid ${t.goldBorder}` },
    approveBtn: { padding: "4px 10px", borderRadius: "6px", border: "none", background: t.greenBg, color: t.green, fontSize: "12px", fontWeight: 600, cursor: "pointer" },
    denyBtn: { padding: "4px 10px", borderRadius: "6px", border: "none", background: t.dangerBg, color: t.red, fontSize: "12px", fontWeight: 600, cursor: "pointer" },
    requestBtn: { padding: "8px 16px", borderRadius: "8px", border: `1px solid ${t.inputBorder}`, background: t.input, color: t.accent, fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    smallBtn: { padding: "6px 12px", borderRadius: "6px", border: `1px solid ${t.inputBorder}`, background: t.input, color: t.textMuted, fontSize: "12px", cursor: "pointer" },
    smallDangerBtn: { padding: "4px 8px", borderRadius: "4px", border: `1px solid ${t.dangerBorder}`, background: t.dangerBg, color: t.red, fontSize: "12px", cursor: "pointer", fontWeight: 700 },
    rolesBar: { display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" },
    roleChip: { display: "flex", flexDirection: "column", gap: "2px", background: t.card, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "6px 12px" },
    groupsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" },
    groupCard: { background: t.card, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "14px", overflow: "hidden" },
    groupHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", gap: "6px", flexWrap: "wrap" },
    groupName: { fontWeight: 700, color: t.textStrong, fontSize: "14px" },
    groupNameInput: { fontWeight: 700, color: t.textStrong, fontSize: "14px", background: "transparent", border: `1px solid ${t.inputBorder}`, borderRadius: "4px", padding: "2px 6px", outline: "none", width: "120px" },
    taskLabel: { fontSize: "12px", color: t.accent, fontWeight: 600, padding: "4px 8px", background: t.taskBg, borderRadius: "4px", display: "inline-block", cursor: "pointer" },
    schedTable: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
    schedTh: { padding: "6px 4px", textAlign: "center", fontWeight: 600, color: t.textMuted, fontSize: "11px", borderBottom: `1px solid ${t.borderLight}` },
    memberCell: { padding: "6px 8px", fontWeight: 600, color: t.text, fontSize: "12px", borderBottom: `1px solid ${t.borderLight}`, whiteSpace: "nowrap", position: "relative" },
    tinyDangerBtn: { position: "absolute", right: "2px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: t.red, fontSize: "14px", cursor: "pointer", padding: "0 2px", opacity: 0.5 },
    schedCell: { padding: "4px 2px", textAlign: "center", borderBottom: `1px solid ${t.borderLight}`, minWidth: "40px", borderRadius: "3px" },
    absSelect: { width: "100%", background: "transparent", border: "none", color: t.textStrong, fontSize: "13px", textAlign: "center", cursor: "pointer", outline: "none" },
    addMemberBtn: { marginTop: "6px", width: "100%", padding: "5px", borderRadius: "6px", border: `1px dashed ${t.inputBorder}`, background: "transparent", color: t.textFaint, fontSize: "11px", cursor: "pointer" },
    legend: { display: "flex", gap: "12px", marginTop: "14px", flexWrap: "wrap", justifyContent: "center" },
    legendItem: { display: "flex", alignItems: "center", gap: "4px" },
  };
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [page, setPage] = useState("cases");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [weekNum, setWeekNum] = useState(NOW_WEEK);
  const [year, setYear] = useState(NOW_YEAR);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState("dark");

  let s = T(theme);

  function tryPin() {
    if (pinInput === ADMIN_PIN) { setIsAdmin(true); setShowPinModal(false); setPinInput(""); setPinError(false); }
    else setPinError(true);
  }
  function flashSaved() { setSaved(true); setTimeout(() => setSaved(false), 1500); }
  function prevWeek() { if (weekNum > 1) setWeekNum(weekNum - 1); else { setYear(year - 1); setWeekNum(52); } }
  function nextWeek() { if (weekNum < 52) setWeekNum(weekNum + 1); else { setYear(year + 1); setWeekNum(1); } }

  let t = themes[theme];

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* header */}
        <div style={s.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <h1 style={s.title}>📋 Case Tracker</h1>
            <div style={s.tabs}>
              <button style={page === "cases" ? s.tabActive : s.tab} onClick={() => setPage("cases")}>Ärenden</button>
              <button style={page === "schedule" ? s.tabActive : s.tab} onClick={() => setPage("schedule")}>Schema</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button style={s.themeBtn} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Byt tema">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isAdmin ? (
                <>
                  <span style={s.adminBadge}>🔑 Admin</span>
                  <button style={s.linkBtn} onClick={() => setIsAdmin(false)}>Logga ut</button>
                </>
              ) : (
                <button style={s.linkBtn} onClick={() => setShowPinModal(true)}>🔒 Admin</button>
              )}
            </div>
            <div style={s.weekPicker}>
              <button style={s.arrowBtn} onClick={prevWeek}>←</button>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={s.yearSelect}>
                {Array.from({ length: 7 }, (_, i) => NOW_YEAR - 3 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span style={{ color: t.textFaint }}>·</span>
              <span style={{ color: t.textMuted, fontSize: "13px" }}>v.</span>
              <select value={weekNum} onChange={(e) => setWeekNum(Number(e.target.value))} style={s.weekSelect}>
                {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>{w}{w === NOW_WEEK && year === NOW_YEAR ? " (nu)" : ""}</option>
                ))}
              </select>
              <button style={s.arrowBtn} onClick={nextWeek}>→</button>
            </div>
          </div>
        </div>

        {/* pin modal */}
        {showPinModal && (
          <div style={s.overlay}>
            <div style={s.modal}>
              <h3 style={{ margin: "0 0 12px 0", color: t.textStrong }}>Ange admin-PIN</h3>
              <input type="password" value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") tryPin(); if (e.key === "Escape") { setShowPinModal(false); setPinInput(""); setPinError(false); } }}
                placeholder="PIN-kod" autoFocus style={s.pinInput} />
              {pinError && <p style={s.pinErr}>Fel PIN-kod</p>}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button style={s.modalBtnCancel} onClick={() => { setShowPinModal(false); setPinInput(""); setPinError(false); }}>Avbryt</button>
                <button style={s.modalBtnOk} onClick={tryPin}>Logga in</button>
              </div>
            </div>
          </div>
        )}

        {saved && <div style={s.savedMsg}>✓ Sparad!</div>}

        {page === "cases" ? (
          <CasesPage weekNum={weekNum} year={year} isAdmin={isAdmin} flashSaved={flashSaved} s={s} t={t} />
        ) : (
          <SchedulePage weekNum={weekNum} year={year} isAdmin={isAdmin} flashSaved={flashSaved} s={s} t={t} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// CASES PAGE
// ============================================================
function CasesPage({ weekNum, year, isAdmin, flashSaved, s, t }) {
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

// ============================================================
// SCHEDULE PAGE
// ============================================================
function SchedulePage({ weekNum, year, isAdmin, flashSaved, s, t }) {
  const [config, setConfig] = useState(null);
  const [absences, setAbsences] = useState({});
  const [requests, setRequests] = useState([]);
  const [taskOverrides, setTaskOverrides] = useState({});
  const [loading, setLoading] = useState(true);

  const [showAddMember, setShowAddMember] = useState(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqDay, setReqDay] = useState("Mån");
  const [reqType, setReqType] = useState("semester");
  const [showEditTasks, setShowEditTasks] = useState(false);
  const [editTaskList, setEditTaskList] = useState([]);
  const [showEditRoles, setShowEditRoles] = useState(false);
  const [editRoles, setEditRoles] = useState({});
  const [editingTaskGroup, setEditingTaskGroup] = useState(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");
  const [reqSent, setReqSent] = useState(false);

  useEffect(() => { loadAll(); }, [weekNum, year]);

  async function loadAll() {
    setLoading(true);
    let cfg = null;
    try { let r = await window.storage.get("schedule-config", true); cfg = JSON.parse(r.value); } catch (e) {}
    if (!cfg) cfg = defaultScheduleConfig();
    if (cfg.tasks && !cfg.rotatingTasks) { cfg.rotatingTasks = cfg.tasks; delete cfg.tasks; }
    setConfig(cfg);
    let abs = {};
    try { let r = await window.storage.get(`y${year}-abs-${weekNum}`, true); abs = JSON.parse(r.value); } catch (e) {}
    setAbsences(abs);
    let reqs = [];
    try { let r = await window.storage.get(`y${year}-reqs-${weekNum}`, true); reqs = JSON.parse(r.value); } catch (e) {}
    setRequests(reqs);
    let ov = {};
    try { let r = await window.storage.get(`y${year}-taskover-${weekNum}`, true); ov = JSON.parse(r.value); } catch (e) {}
    setTaskOverrides(ov);
    setLoading(false);
  }

  async function saveConfig(cfg) { setConfig(cfg); try { await window.storage.set("schedule-config", JSON.stringify(cfg), true); flashSaved(); } catch (e) {} }
  async function saveAbsences(abs) { setAbsences(abs); try { await window.storage.set(`y${year}-abs-${weekNum}`, JSON.stringify(abs), true); flashSaved(); } catch (e) {} }
  async function saveRequests(reqs) {
    setRequests(reqs);
    try { let r = await window.storage.set(`y${year}-reqs-${weekNum}`, JSON.stringify(reqs), true); if (r) flashSaved(); } catch (e) { console.log("saveRequests error: " + e.message); }
  }
  async function saveTaskOverrides(ov) { setTaskOverrides(ov); try { await window.storage.set(`y${year}-taskover-${weekNum}`, JSON.stringify(ov), true); flashSaved(); } catch (e) {} }

  function getTaskForGroup(gi) {
    if (!config) return "";
    let group = config.groups[gi];
    if (taskOverrides[gi] !== undefined) return taskOverrides[gi];
    if (group.fixedTask) return group.fixedTask;
    let rotIdx = 0;
    for (let i = 0; i < gi; i++) { if (!config.groups[i].fixedTask) rotIdx++; }
    let totalRot = config.groups.filter((g) => !g.fixedTask).length;
    let totalTasks = (config.rotatingTasks || []).length;
    if (totalTasks === 0 || totalRot === 0) return "";
    let diff = (year - config.baseYear) * 52 + (weekNum - config.baseWeek);
    let shifted = ((rotIdx - diff) % totalRot + totalRot) % totalRot;
    return (config.rotatingTasks || [])[shifted % totalTasks] || "";
  }

  function startTaskEdit(gi) { if (!isAdmin) return; setEditingTaskGroup(gi); setEditingTaskValue(getTaskForGroup(gi)); }
  function confirmTaskEdit() { if (editingTaskGroup === null) return; let u = { ...taskOverrides, [editingTaskGroup]: editingTaskValue }; saveTaskOverrides(u); setEditingTaskGroup(null); }
  function resetTaskOverride(gi) { let u = { ...taskOverrides }; delete u[gi]; saveTaskOverrides(u); }

  function getAbsence(name, di) { return absences[`${name}-${di}`] || "none"; }
  function setAbsence(name, di, type) { let u = { ...absences }; if (type === "none") delete u[`${name}-${di}`]; else u[`${name}-${di}`] = type; saveAbsences(u); }

  function submitRequest() {
    if (!reqName.trim()) return;
    let newReq = { id: Date.now(), name: reqName.trim(), day: reqDay, type: reqType, status: "pending" };
    saveRequests([...requests, newReq]);
    setShowRequest(false); setReqName(""); setReqSent(true); setTimeout(() => setReqSent(false), 3000);
  }
  function approveRequest(req) { let di = DAYS.indexOf(req.day); if (di >= 0) setAbsence(req.name, di, req.type); saveRequests(requests.filter((r) => r.id !== req.id)); }
  function denyRequest(id) { saveRequests(requests.filter((r) => r.id !== id)); }

  function addMember(gi) { if (!newMemberName.trim() || !config) return; let u = { ...config, groups: config.groups.map((g, i) => i === gi ? { ...g, members: [...g.members, newMemberName.trim()] } : g) }; saveConfig(u); setNewMemberName(""); setShowAddMember(null); }
  function removeMember(gi, mi) { if (!config) return; let u = { ...config, groups: config.groups.map((g, i) => i === gi ? { ...g, members: g.members.filter((_, j) => j !== mi) } : g) }; saveConfig(u); }
  function renameGroup(gi, name) { if (!config) return; let u = { ...config, groups: config.groups.map((g, i) => i === gi ? { ...g, name } : g) }; saveConfig(u); }
  function addGroup() { if (!config) return; saveConfig({ ...config, groups: [...config.groups, { name: `Grupp ${config.groups.length + 1}`, members: [], fixedTask: null }] }); }
  function removeGroup(gi) { if (!config) return; saveConfig({ ...config, groups: config.groups.filter((_, i) => i !== gi) }); }
  function toggleFixed(gi) {
    if (!config) return; let g = config.groups[gi]; let task = getTaskForGroup(gi);
    let u = { ...config, groups: config.groups.map((grp, i) => i === gi ? { ...grp, fixedTask: grp.fixedTask ? null : (task || "Fast uppgift") } : grp) };
    saveConfig(u);
  }
  function saveTasks() { if (!config) return; saveConfig({ ...config, rotatingTasks: editTaskList.filter((x) => x.trim()), baseWeek: weekNum, baseYear: year }); setShowEditTasks(false); }
  function saveRolesEdit() { if (!config) return; saveConfig({ ...config, roles: { ...editRoles } }); setShowEditRoles(false); }

  if (loading || !config) return <p style={{ textAlign: "center", color: t.textMuted, padding: "40px" }}>Laddar...</p>;
  let pendingReqs = requests.filter((r) => r.status === "pending");

  return (
    <>
      {/* admin: pending requests */}
      {isAdmin && pendingReqs.length > 0 && (
        <div style={s.requestsBar}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: t.gold, marginBottom: "8px" }}>📨 {pendingReqs.length} frånvaroförfrågan att hantera</div>
          {pendingReqs.map((req) => (
            <div key={req.id} style={s.requestRow}>
              <span style={{ flex: 1, fontSize: "13px", color: t.text }}><strong>{req.name}</strong> — {req.day} — {ABSENCE_TYPES[req.type]?.label || req.type}</span>
              <button style={s.approveBtn} onClick={() => approveRequest(req)}>✓ Godkänn</button>
              <button style={s.denyBtn} onClick={() => denyRequest(req.id)}>✗ Neka</button>
            </div>
          ))}
        </div>
      )}

      {/* user: request button */}
      {!isAdmin && (
        <div style={{ marginBottom: "12px" }}>
          <button style={s.requestBtn} onClick={() => setShowRequest(true)}>📝 Begär frånvaro</button>
          {reqSent && <span style={{ marginLeft: "10px", color: t.green, fontSize: "13px", fontWeight: 600 }}>✓ Förfrågan skickad!</span>}
          {pendingReqs.length > 0 && (
            <div style={{ marginTop: "8px", padding: "10px 14px", background: t.accentBg, border: `1px solid ${t.accentBorder}`, borderRadius: "10px" }}>
              <div style={{ fontSize: "12px", color: t.accent, marginBottom: "6px", fontWeight: 600 }}>Väntande förfrågningar:</div>
              {pendingReqs.map((req) => (
                <div key={req.id} style={{ fontSize: "12px", color: t.textMuted, padding: "3px 0" }}>⏳ <strong>{req.name}</strong> — {req.day} — {ABSENCE_TYPES[req.type]?.label || req.type}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* request modal */}
      {showRequest && (
        <div style={s.overlay}><div style={s.modal}>
          <h3 style={{ margin: "0 0 12px 0", color: t.textStrong }}>Begär frånvaro</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input type="text" placeholder="Ditt namn" value={reqName} onChange={(e) => setReqName(e.target.value)} style={s.textInput} />
            <select value={reqDay} onChange={(e) => setReqDay(e.target.value)} style={s.selectInput}>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={reqType} onChange={(e) => setReqType(e.target.value)} style={s.selectInput}>
              <option value="semester">Semester</option><option value="sjuk">Sjuk</option><option value="vab">VAB</option><option value="annan">Annan frånvaro</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <button style={s.modalBtnCancel} onClick={() => setShowRequest(false)}>Avbryt</button>
            <button style={s.modalBtnOk} onClick={submitRequest}>Skicka</button>
          </div>
        </div></div>
      )}

      {/* edit tasks modal */}
      {showEditTasks && (
        <div style={s.overlay}><div style={{ ...s.modal, maxWidth: "400px", width: "90%" }}>
          <h3 style={{ margin: "0 0 12px 0", color: t.textStrong }}>Redigera roterande uppgifter</h3>
          <p style={{ fontSize: "12px", color: t.textMuted, margin: "0 0 10px 0" }}>Ordningen bestämmer rotation. Nollställs till denna vecka vid sparande.</p>
          {editTaskList.map((x, i) => (
            <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
              <input type="text" value={x} onChange={(e) => { let u = [...editTaskList]; u[i] = e.target.value; setEditTaskList(u); }} style={{ ...s.textInput, flex: 1 }} />
              <button style={s.smallDangerBtn} onClick={() => setEditTaskList(editTaskList.filter((_, j) => j !== i))}>✗</button>
            </div>
          ))}
          <button style={s.smallBtn} onClick={() => setEditTaskList([...editTaskList, ""])}>+ Lägg till</button>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <button style={s.modalBtnCancel} onClick={() => setShowEditTasks(false)}>Avbryt</button>
            <button style={s.modalBtnOk} onClick={saveTasks}>Spara</button>
          </div>
        </div></div>
      )}

      {/* edit roles modal */}
      {showEditRoles && (
        <div style={s.overlay}><div style={{ ...s.modal, maxWidth: "400px", width: "90%" }}>
          <h3 style={{ margin: "0 0 12px 0", color: t.textStrong }}>Redigera roller</h3>
          {Object.entries(editRoles).map(([role, name]) => (
            <div key={role} style={{ display: "flex", gap: "6px", marginBottom: "6px", alignItems: "center" }}>
              <input type="text" value={role} onChange={(e) => { let u = {}; Object.entries(editRoles).forEach(([k, v]) => { u[k === role ? e.target.value : k] = v; }); setEditRoles(u); }} style={{ ...s.textInput, flex: 1 }} placeholder="Roll" />
              <input type="text" value={name} onChange={(e) => setEditRoles({ ...editRoles, [role]: e.target.value })} style={{ ...s.textInput, flex: 1 }} placeholder="Namn" />
              <button style={s.smallDangerBtn} onClick={() => { let u = { ...editRoles }; delete u[role]; setEditRoles(u); }}>✗</button>
            </div>
          ))}
          <button style={s.smallBtn} onClick={() => setEditRoles({ ...editRoles, ["Ny roll"]: "" })}>+ Lägg till</button>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <button style={s.modalBtnCancel} onClick={() => setShowEditRoles(false)}>Avbryt</button>
            <button style={s.modalBtnOk} onClick={saveRolesEdit}>Spara</button>
          </div>
        </div></div>
      )}

      {/* add member modal */}
      {showAddMember !== null && (
        <div style={s.overlay}><div style={s.modal}>
          <h3 style={{ margin: "0 0 12px 0", color: t.textStrong }}>Lägg till medlem</h3>
          <input type="text" placeholder="Namn" value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addMember(showAddMember); }}
            autoFocus style={s.textInput} />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button style={s.modalBtnCancel} onClick={() => { setShowAddMember(null); setNewMemberName(""); }}>Avbryt</button>
            <button style={s.modalBtnOk} onClick={() => addMember(showAddMember)}>Lägg till</button>
          </div>
        </div></div>
      )}

      {/* admin toolbar */}
      {isAdmin && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          <button style={s.smallBtn} onClick={() => { setEditTaskList([...(config.rotatingTasks || [])]); setShowEditTasks(true); }}>✏️ Roterande uppgifter</button>
          <button style={s.smallBtn} onClick={() => { setEditRoles({ ...config.roles }); setShowEditRoles(true); }}>👥 Roller</button>
          <button style={s.smallBtn} onClick={addGroup}>+ Grupp</button>
        </div>
      )}

      {/* roles */}
      {config.roles && Object.keys(config.roles).length > 0 && (
        <div style={s.rolesBar}>
          {Object.entries(config.roles).map(([role, name]) => (
            <div key={role} style={s.roleChip}>
              <span style={{ color: t.textMuted, fontSize: "11px" }}>{role}</span>
              <span style={{ color: t.textStrong, fontSize: "13px", fontWeight: 600 }}>{name}</span>
            </div>
          ))}
        </div>
      )}

      {/* groups */}
      <div style={s.groupsGrid}>
        {config.groups.map((group, gi) => {
          let task = getTaskForGroup(gi);
          return (
            <div key={gi} style={s.groupCard}>
              <div style={s.groupHeader}>
                {isAdmin ? (
                  <input type="text" value={group.name} onChange={(e) => renameGroup(gi, e.target.value)} style={s.groupNameInput} />
                ) : (
                  <span style={s.groupName}>{group.name}</span>
                )}
                {isAdmin && <button style={s.smallDangerBtn} onClick={() => removeGroup(gi)} title="Ta bort grupp">✗</button>}
                {isAdmin && (
                  <button style={{ ...s.smallBtn, fontSize: "10px", padding: "2px 6px" }}
                    onClick={() => toggleFixed(gi)} title={group.fixedTask ? "Gör roterande" : "Gör fast"}>
                    {group.fixedTask ? "📌 Fast" : "🔄 Roterar"}
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                {editingTaskGroup === gi ? (
                  <input type="text" value={editingTaskValue}
                    onChange={(e) => setEditingTaskValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") confirmTaskEdit(); if (e.key === "Escape") setEditingTaskGroup(null); }}
                    onBlur={confirmTaskEdit} autoFocus
                    style={{ ...s.textInput, fontSize: "12px", padding: "4px 8px", flex: 1 }} />
                ) : (
                  <div style={s.taskLabel} onClick={() => startTaskEdit(gi)} title={isAdmin ? "Klicka för att ändra uppgift denna vecka" : ""}>
                    {task || "Ingen uppgift"}
                    {isAdmin && <span style={{ marginLeft: "6px", fontSize: "10px", opacity: 0.5 }}>✏️</span>}
                  </div>
                )}
                {isAdmin && taskOverrides[gi] !== undefined && (
                  <button style={{ ...s.smallBtn, fontSize: "10px", padding: "2px 6px" }} onClick={() => resetTaskOverride(gi)} title="Återställ">↺</button>
                )}
                {group.fixedTask && <span style={{ fontSize: "10px", color: t.textFaint, background: t.cardAlt, padding: "2px 6px", borderRadius: "4px", border: `1px solid ${t.border}` }}>Fast uppgift</span>}
              </div>

              <table style={s.schedTable}>
                <thead><tr><th style={s.schedTh}></th>{DAYS.map((d) => <th key={d} style={s.schedTh}>{d}</th>)}</tr></thead>
                <tbody>
                  {group.members.map((member, mi) => (
                    <tr key={mi}>
                      <td style={s.memberCell}>
                        {member}
                        {isAdmin && <button style={s.tinyDangerBtn} onClick={() => removeMember(gi, mi)} title="Ta bort">×</button>}
                      </td>
                      {DAYS.map((_, di) => {
                        let absType = getAbsence(member, di);
                        let info = ABSENCE_TYPES[absType] || ABSENCE_TYPES.none;
                        return (
                          <td key={di} style={{ ...s.schedCell, background: info.color }} title={info.label !== "–" ? info.label : ""}>
                            {isAdmin && (
                              <select value={absType} onChange={(e) => setAbsence(member, di, e.target.value)} style={s.absSelect}>
                                <option value="none">–</option><option value="semester">🏖️</option><option value="sjuk">🤒</option><option value="vab">👶</option><option value="annan">📌</option>
                              </select>
                            )}
                            {!isAdmin && info.label !== "–" && <span style={{ fontSize: "11px", color: info.text, fontWeight: 600 }}>{info.label}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {isAdmin && <button style={s.addMemberBtn} onClick={() => setShowAddMember(gi)}>+ Medlem</button>}
            </div>
          );
        })}
      </div>

      {/* legend */}
      <div style={s.legend}>
        {Object.entries(ABSENCE_TYPES).filter(([k]) => k !== "none").map(([key, val]) => (
          <div key={key} style={s.legendItem}>
            <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: val.color }} />
            <span style={{ fontSize: "11px", color: t.textMuted }}>{val.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
