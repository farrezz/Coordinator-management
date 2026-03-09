import { DAYS_LONG, CATEGORIES, NOW_WEEK, NOW_YEAR } from "../constants/index.js";

export function makeEmptyWeek() {
  let d = {};
  DAYS_LONG.forEach((day) => { d[day] = {}; CATEGORIES.forEach((c) => { d[day][c] = 0; }); });
  return d;
}

export function makeEmptyGoals() {
  let g = {};
  CATEGORIES.forEach((c) => { g[c] = 0; });
  return g;
}

export function defaultScheduleConfig() {
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
