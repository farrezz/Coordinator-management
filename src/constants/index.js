import { getWeekNumber } from "../utils/dateUtils.js";

export const ADMIN_PIN = "1234";

export const DAYS = ["Mån", "Tis", "Ons", "Tor", "Fre"];
export const DAYS_LONG = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];
export const CATEGORIES = ["Beredningar"];
export const CASE_TYPES = [
  "Invänta sökandesammanställning",
  "Hantera yttrande",
  "Ta emot sökandesammanställning",
];
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
    bg: "#141624", card: "#1d2035", cardAlt: "#181b2e", border: "#272a40",
    borderLight: "#1e2138", text: "#c8cde0", textStrong: "#e8ecff", textMuted: "#7a82a0",
    textFaint: "#4a5070", accent: "#5b7fff", accentBg: "#1a2040", accentBorder: "#333a5f",
    input: "#1a1e32", inputBorder: "#2d3150", green: "#4ade80", greenBg: "#152a1a",
    greenBorder: "#1a3a2a", red: "#f87171", redBg: "#2a1520", redBorder: "#3a2030",
    gold: "#f0c060", goldBg: "#2a1f10", goldBorder: "#5a4020", taskBg: "#151830",
    dangerBg: "#3a1515", dangerBorder: "#5a2020",
  },
  light: {
    bg: "#f5f4f1", card: "#fdfcfa", cardAlt: "#f7f5f2", border: "#e0dbd5",
    borderLight: "#ece8e3", text: "#334155", textStrong: "#0f172a", textMuted: "#6b6660",
    textFaint: "#9e9890", accent: "#3b5bdb", accentBg: "#eef1ff", accentBorder: "#b4c2f7",
    input: "#eeece8", inputBorder: "#cdc8c0", green: "#16a34a", greenBg: "#ecfdf5",
    greenBorder: "#a7f3d0", red: "#dc2626", redBg: "#fef2f2", redBorder: "#fecaca",
    gold: "#b45309", goldBg: "#fffbeb", goldBorder: "#fde68a", taskBg: "#eef1ff",
    dangerBg: "#fef2f2", dangerBorder: "#fecaca",
  },
  christmas: {
    bg: "#0c1810", card: "#122015", cardAlt: "#0e1a11", border: "#1e3022",
    borderLight: "#182813", text: "#d4e8d0", textStrong: "#eaf5e6", textMuted: "#7a9e78",
    textFaint: "#4a6e48", accent: "#c0392b", accentBg: "#2a0e0c", accentBorder: "#5a1e1a",
    input: "#0e1c12", inputBorder: "#1e3020", green: "#4ade80", greenBg: "#0e2016",
    greenBorder: "#1a3a20", red: "#f87171", redBg: "#2a1010", redBorder: "#3a1818",
    gold: "#f0c060", goldBg: "#2a2010", goldBorder: "#5a4010", taskBg: "#1a0e0c",
    dangerBg: "#2a0e0c", dangerBorder: "#5a1a1a",
  },
  valentines: {
    bg: "#170c11", card: "#200f18", cardAlt: "#1a0d15", border: "#35182a",
    borderLight: "#281220", text: "#e8d0d8", textStrong: "#f5e0ea", textMuted: "#a07080",
    textFaint: "#6a4055", accent: "#e91e8c", accentBg: "#2a0820", accentBorder: "#5a1040",
    input: "#1c0e16", inputBorder: "#301525", green: "#4ade80", greenBg: "#102016",
    greenBorder: "#1a3a22", red: "#f87171", redBg: "#2a1015", redBorder: "#3a1820",
    gold: "#f0c060", goldBg: "#2a1e10", goldBorder: "#5a3e10", taskBg: "#1a0818",
    dangerBg: "#2a0818", dangerBorder: "#5a1030",
  },
  summer: {
    bg: "#0d1a2a", card: "#12223a", cardAlt: "#0e1e32", border: "#1e3050",
    borderLight: "#162840", text: "#d0e4f8", textStrong: "#e8f4ff", textMuted: "#6892b8",
    textFaint: "#3a6080", accent: "#f59e0b", accentBg: "#2a1e08", accentBorder: "#5a4010",
    input: "#0e1e30", inputBorder: "#1a2e48", green: "#34d399", greenBg: "#0a2018",
    greenBorder: "#1a3a28", red: "#f87171", redBg: "#2a1218", redBorder: "#3a2020",
    gold: "#fbbf24", goldBg: "#281a08", goldBorder: "#5a3a08", taskBg: "#0e1a28",
    dangerBg: "#2a1010", dangerBorder: "#3a2018",
  },
};
