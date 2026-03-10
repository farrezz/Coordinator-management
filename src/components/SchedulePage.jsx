import { useState, useEffect } from "react";
import { DAYS, ABSENCE_TYPES } from "../constants/index.js";
import { defaultScheduleConfig } from "../utils/dataUtils.js";
import { storage } from "../utils/storage.js";

export default function SchedulePage({ weekNum, year, isAdmin, flashSaved, s, t }) {
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

  useEffect(() => {
    setLoading(true);
    let got = { cfg: false, abs: false, reqs: false, ov: false };
    function checkDone() { if (got.cfg && got.abs && got.reqs && got.ov) setLoading(false); }
    const u1 = storage.subscribe("schedule-config", (r) => {
      let cfg = r ? JSON.parse(r.value) : defaultScheduleConfig();
      if (cfg.tasks && !cfg.rotatingTasks) { cfg.rotatingTasks = cfg.tasks; delete cfg.tasks; }
      setConfig(cfg); got.cfg = true; checkDone();
    });
    const u2 = storage.subscribe(`y${year}-abs-${weekNum}`, (r) => {
      setAbsences(r ? JSON.parse(r.value) : {}); got.abs = true; checkDone();
    });
    const u3 = storage.subscribe(`y${year}-reqs-${weekNum}`, (r) => {
      setRequests(r ? JSON.parse(r.value) : []); got.reqs = true; checkDone();
    });
    const u4 = storage.subscribe(`y${year}-taskover-${weekNum}`, (r) => {
      setTaskOverrides(r ? JSON.parse(r.value) : {}); got.ov = true; checkDone();
    });
    return () => { u1(); u2(); u3(); u4(); };
  }, [weekNum, year]);

  async function saveConfig(cfg) { setConfig(cfg); try { await storage.set("schedule-config", JSON.stringify(cfg), true); flashSaved(); } catch (e) {} }
  async function saveAbsences(abs) { setAbsences(abs); try { await storage.set(`y${year}-abs-${weekNum}`, JSON.stringify(abs), true); flashSaved(); } catch (e) {} }
  async function saveRequests(reqs) {
    setRequests(reqs);
    try { let r = await storage.set(`y${year}-reqs-${weekNum}`, JSON.stringify(reqs), true); if (r) flashSaved(); } catch (e) { console.log("saveRequests error: " + e.message); }
  }
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
