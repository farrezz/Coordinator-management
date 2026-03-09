import { getWeekNumber } from "../utils/dateUtils.js";

export const ADMIN_PIN = "1234";

export const DAYS = ["Mån", "Tis", "Ons", "Tor", "Fre"];
export const DAYS_LONG = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];
export const CATEGORIES = ["Beredningar", "IA", "IA med Kandidater"];
export const NOW_WEEK = getWeekNumber(new Date());
export const NOW_YEAR = new Date().getFullYear();

export const ABSENCE_TYPES = {
  none: { label: "–", color: "transparent", text: "#666" },
  semester: { label: "Semester", color: "#dc2626", text: "#fff" },
  sjuk: { label: "Sjuk", color: "#eab308", text: "#000" },
  vab: { label: "VAB", color: "#e67e22", text: "#fff" },
  annan: { label: "Annan", color: "#7c3aed", text: "#fff" },
};

export const themes = {
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
