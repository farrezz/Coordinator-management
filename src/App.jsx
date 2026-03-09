import { useState } from "react";
import { ADMIN_PIN, NOW_WEEK, NOW_YEAR, themes } from "./constants/index.js";
import { T } from "./utils/styles.js";
import CasesPage from "./components/CasesPage.jsx";
import SchedulePage from "./components/SchedulePage.jsx";

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
