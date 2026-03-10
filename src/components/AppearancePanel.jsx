import { useState, useRef } from "react";
import { storage } from "../utils/storage.js";

const THEME_OPTIONS = [
  { key: "dark", label: "Mörk" },
  { key: "light", label: "Ljus" },
  { key: "christmas", label: "Jul" },
  { key: "valentines", label: "Alla hjärtans" },
  { key: "summer", label: "Sommar" },
];

export default function AppearancePanel({ t, appSettings, onSave }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function setTheme(key) {
    onSave({ ...appSettings, theme: key });
  }

  function setCustomBg(color) {
    onSave({ ...appSettings, customBgColor: color });
  }

  function clearCustomBg() {
    onSave({ ...appSettings, customBgColor: null });
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await storage.uploadImage(file);
      onSave({ ...appSettings, bgImage: url });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage() {
    onSave({ ...appSettings, bgImage: null });
  }

  function setOpacity(val) {
    onSave({ ...appSettings, bgImageOpacity: Number(val) / 100 });
  }

  const opacity = Math.round((appSettings.bgImageOpacity ?? 0.12) * 100);

  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "14px 18px", marginBottom: "16px" }}>
      <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: t.textFaint, fontWeight: 600, marginBottom: "12px" }}>
        Utseende
      </div>

      {/* Theme selector */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "12px", color: t.textMuted, marginBottom: "6px" }}>Tema</div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {THEME_OPTIONS.map(({ key, label }) => (
            <button key={key} onClick={() => setTheme(key)}
              style={{
                padding: "6px 14px", borderRadius: "7px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                border: appSettings.theme === key ? `1px solid ${t.accent}` : `1px solid ${t.border}`,
                background: appSettings.theme === key ? t.accentBg : t.cardAlt,
                color: appSettings.theme === key ? t.accent : t.textMuted,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Background color */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "12px", color: t.textMuted, marginBottom: "6px" }}>Bakgrundsfärg</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input type="color" value={appSettings.customBgColor || "#141624"}
            onChange={(e) => setCustomBg(e.target.value)}
            style={{ width: "36px", height: "32px", border: `1px solid ${t.border}`, borderRadius: "6px", background: "none", cursor: "pointer", padding: "2px" }} />
          <span style={{ fontSize: "13px", color: t.textMuted }}>{appSettings.customBgColor || "Standard"}</span>
          {appSettings.customBgColor && (
            <button onClick={clearCustomBg}
              style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${t.border}`, background: t.cardAlt, color: t.textMuted, fontSize: "12px", cursor: "pointer" }}>
              Återställ
            </button>
          )}
        </div>
      </div>

      {/* Background image */}
      <div>
        <div style={{ fontSize: "12px", color: t.textMuted, marginBottom: "6px" }}>Bakgrundsbild</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ padding: "6px 14px", borderRadius: "7px", border: `1px solid ${t.inputBorder}`, background: t.input, color: t.accent, fontSize: "13px", fontWeight: 600, cursor: uploading ? "default" : "pointer", opacity: uploading ? 0.6 : 1 }}>
            {uploading ? "Laddar upp..." : "Välj bild..."}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
          {appSettings.bgImage && (
            <button onClick={removeImage}
              style={{ padding: "6px 12px", borderRadius: "7px", border: `1px solid ${t.dangerBorder}`, background: t.dangerBg, color: t.red, fontSize: "13px", cursor: "pointer" }}>
              Ta bort bild
            </button>
          )}
        </div>
        {appSettings.bgImage && (
          <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: t.textMuted, whiteSpace: "nowrap" }}>Opacitet: {opacity}%</span>
            <input type="range" min="5" max="30" value={opacity} onChange={(e) => setOpacity(e.target.value)}
              style={{ flex: 1, accentColor: t.accent }} />
          </div>
        )}
      </div>
    </div>
  );
}
