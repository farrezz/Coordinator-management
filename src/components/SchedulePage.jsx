import { useState, useEffect } from "react";
import { DAYS, ABSENCE_TYPES } from "../constants/index.js";
import { getWeekNumber } from "../utils/dateUtils.js";
import { defaultScheduleConfig } from "../utils/dataUtils.js";
import { storage } from "../utils/storage.js";

export default function SchedulePage({ weekNum, year, isAdmin, flashSaved, s, t }) {
  const [config, setConfig] = useState(null);
  const [absences, setAbsences] = useState({});
  const [taskOverrides, setTaskOverrides] = useState({});
  const [loading, setLoading] = useState(true);

  const [showAddMember, setShowAddMember] = useState(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [showEditTasks, setShowEditTasks] = useState(false);
  const [editTaskList, setEditTaskList] = useState([]);
  const [showEditRoles, setShowEditRoles] = useState(false);
  const [editRoles, setEditRoles] = useState({});
  const [editingTaskGroup, setEditingTaskGroup] = useState(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");

  const [editingNotes, setEditingNotes] = useState({});

  const [showRange, setShowRange] = useState(false);
  const [rangeName, setRangeName] = useState("");
  const [rangeType, setRangeType] = useState("semester");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  useEffect(() => {
    setLoading(true);
    let got = { cfg: false, abs: false, ov: false };
    function checkDone() { if (got.cfg && got.abs && got.ov) setLoading(false); }
    const u1 = storage.subscribe("schedule-config", (r) => {
      let cfg = r ? JSON.parse(r.value) : defaultScheduleConfig();
      if (cfg.tasks && !cfg.rotatingTasks) { cfg.rotatingTasks = cfg.tasks; delete cfg.tasks; }
      setConfig(cfg); got.cfg = true; checkDone();
    });
    const u2 = storage.subscribe(`y${year}-abs-${weekNum}`, (r) => {
      setAbsences(r ? JSON.parse(r.value) : {}); got.abs = true; checkDone();
    });
    const u4 = storage.subscribe(`y${year}-taskover-${weekNum}`, (r) => {
      setTaskOverrides(r ? JSON.parse(r.value) : {}); got.ov = true; checkDone();
    });
    return () => { u1(); u2(); u4(); };
  }, [weekNum, year]);

  async function saveConfig(cfg) { setConfig(cfg); try { await storage.set("schedule-config", JSON.stringify(cfg), true); flashSaved(); } catch (e) {} }
  async function saveAbsences(abs) { setAbsences(abs); try { await storage.set(`y${year}-abs-${weekNum}`, JSON.stringify(abs), true); flashSaved(); } catch (e) {} }
  async function saveTaskOverrides(ov) { setTaskOverrides(ov); try { await storage.set(`y${year}-taskover-${weekNum}`, JSON.stringify(ov), true); flashSaved(); } catch (e) {} }

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
  function setAbsence(name, di, type) {
    let u = { ...absences };
    if (type === "none") { delete u[`${name}-${di}`]; delete u[`${name}-${di}-note`]; }
    else u[`${name}-${di}`] = type;
    saveAbsences(u);
  }
  function setAbsenceNote(name, di, text) {
    const noteKey = `${name}-${di}-note`;
    let u = { ...absences };
    if (!text) delete u[noteKey]; else u[noteKey] = text;
    saveAbsences(u);
  }

  async function applyAbsenceRange() {
    if (!rangeName || !rangeFrom || !rangeTo) return;
    const from = new Date(rangeFrom + "T00:00:00");
    const to = new Date(rangeTo + "T00:00:00");
    if (from > to) return;

    const byWeek = {};
    const cur = new Date(from);
    while (cur <= to) {
      const wn = getWeekNumber(cur);
      const wy = cur.getFullYear();
      const wkey = `${wy}-${wn}`;
      if (!byWeek[wkey]) byWeek[wkey] = { wy, wn, days: [] };
      byWeek[wkey].days.push((cur.getDay() + 6) % 7);
      cur.setDate(cur.getDate() + 1);
    }

    for (const { wy, wn, days } of Object.values(byWeek)) {
      await storage.adjust(`y${wy}-abs-${wn}`, (current) => {
        const abs = current || {};
        const updated = { ...abs };
        for (const di of days) {
          if (rangeType === "none") delete updated[`${rangeName}-${di}`];
          else updated[`${rangeName}-${di}`] = rangeType;
        }
        return updated;
      });
    }
    flashSaved();
    setShowRange(false);
    setRangeName(""); setRangeFrom(""); setRangeTo(""); setRangeType("semester");
  }

  function addMember(gi) { if (!newMemberName.trim() || !config) return; let u = { ...config, groups: config.groups.map((g, i) => i === gi ? { ...g, members: [...g.members, newMemberName.trim()] } : g) }; saveConfig(u); setNewMemberName(""); setShowAddMember(null); }
  function removeMember(gi, mi) { if (!config) return; let u = { ...config, groups: config.groups.map((g, i) => i === gi ? { ...g, members: g.members.filter((_, j) => j !== mi) } : g) }; saveConfig(u); }
  function renameGroup(gi, name) { if (!config) return; let u = { ...config, groups: config.groups.map((g, i) => i === gi ? { ...g, name } : g) }; saveConfig(u); }
  function addGroup() { if (!config) return; saveConfig({ ...config, groups: [...config.groups, { name: `Grupp ${config.groups.length + 1}`, members: [], fixedTask: null }] }); }
  function removeGroup(gi) { if (!config) return; saveConfig({ ...config, groups: config.groups.filter((_, i) => i !== gi) }); }
  function toggleFixed(gi) {
    if (!config) return; let task = getTaskForGroup(gi);
    let u = { ...config, groups: config.groups.map((grp, i) => i === gi ? { ...grp, fixedTask: grp.fixedTask ? null : (task || "Fast uppgift") } : grp) };
    saveConfig(u);
  }
  function saveTasks() { if (!config) return; saveConfig({ ...config, rotatingTasks: editTaskList.filter((x) => x.trim()), baseWeek: weekNum, baseYear: year }); setShowEditTasks(false); }
  function saveRolesEdit() { if (!config) return; saveConfig({ ...config, roles: { ...editRoles } }); setShowEditRoles(false); }

  if (loading || !config) return <p style={{ textAlign: "center", color: t.textMuted, padding: "40px" }}>Laddar...</p>;
  const allMembers = config.groups.flatMap((g) => g.members);

  return (
    <>
      {/* absence range modal */}
      {showRange && (
        <div style={s.overlay}><div style={{ ...s.modal, maxWidth: "380px", width: "90%" }}>
          <h3 style={{ margin: "0 0 12px 0", color: t.textStrong }}>Frånvaroperiod</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <select value={rangeName} onChange={(e) => setRangeName(e.target.value)} style={s.selectInput}>
              <option value="">Välj person…</option>
              {allMembers.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={rangeType} onChange={(e) => setRangeType(e.target.value)} style={s.selectInput}>
              <option value="semester">Semester</option>
              <option value="sjuk">Sjuk</option>
              <option value="vab">VAB</option>
              <option value="annan">Övrigt</option>
            </select>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "4px" }}>Från</div>
                <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} style={{ ...s.textInput, width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "4px" }}>Till</div>
                <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} style={{ ...s.textInput, width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <button style={s.modalBtnCancel} onClick={() => setShowRange(false)}>Avbryt</button>
            <button style={{ ...s.modalBtnOk, opacity: (!rangeName || !rangeFrom || !rangeTo) ? 0.5 : 1 }}
              onClick={applyAbsenceRange} disabled={!rangeName || !rangeFrom || !rangeTo}>Applicera</button>
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

      {/* toolbar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <button style={s.requestBtn} onClick={() => { setRangeName(allMembers[0] || ""); setShowRange(true); }}>📅 Frånvaroperiod</button>
        {isAdmin && (
          <>
            <button style={s.smallBtn} onClick={() => { setEditTaskList([...(config.rotatingTasks || [])]); setShowEditTasks(true); }}>✏️ Roterande uppgifter</button>
            <button style={s.smallBtn} onClick={() => { setEditRoles({ ...config.roles }); setShowEditRoles(true); }}>👥 Roller</button>
            <button style={s.smallBtn} onClick={addGroup}>+ Grupp</button>
          </>
        )}
      </div>

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
                        const noteKey = `${member}-${di}-note`;
                        const savedNote = absences[noteKey] || "";
                        const editKey = `${member}-${di}`;
                        const currentNote = editingNotes[editKey] ?? savedNote;
                        return (
                          <td key={di} style={{ ...s.schedCell, background: info.color }} title={info.label !== "–" ? info.label : ""}>
                            <select value={absType} onChange={(e) => setAbsence(member, di, e.target.value)} style={s.absSelect}>
                              <option value="none">–</option>
                              <option value="semester">🏖️</option>
                              <option value="sjuk">🤒</option>
                              <option value="vab">👶</option>
                              <option value="annan">📌</option>
                            </select>
                            {absType !== "none" && (
                              <input
                                type="text"
                                value={currentNote}
                                onChange={(e) => setEditingNotes((p) => ({ ...p, [editKey]: e.target.value }))}
                                onBlur={() => {
                                  const val = (editingNotes[editKey] ?? savedNote).trim();
                                  setAbsenceNote(member, di, val);
                                  setEditingNotes((p) => { const u = { ...p }; delete u[editKey]; return u; });
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                                placeholder="fm, 2h…"
                                style={{ width: "100%", fontSize: "10px", background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.2)", color: info.text, textAlign: "center", padding: "2px 0", outline: "none", boxSizing: "border-box" }}
                              />
                            )}
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
