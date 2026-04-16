import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/* ──────────────────────────────────────────────
   Theme palette definitions
   Each theme overrides the CSS custom properties
   that drive both shadcn/ui components AND the
   hard-coded accent classes across pages.
────────────────────────────────────────────── */
export type ThemeKey = "blue" | "green" | "purple" | "red" | "gray";

export interface ThemePalette {
  key: ThemeKey;
  label: string;
  primary: string;       // main accent (buttons, active tabs, badges…)
  primaryFg: string;     // text on primary bg
  secondary: string;     // light wash of primary
  secondaryFg: string;
  accent: string;        // same as secondary for shadcn
  accentFg: string;
  ring: string;
  sidebar: string;       // sidebar background
  sidebarPrimary: string;// sidebar active indicator
  sidebarRing: string;
  /** Tailwind-equivalent classes for dynamic inline usage */
  textClass: string;
  bgClass: string;
}

export const THEMES: ThemePalette[] = [
  {
    key: "blue", label: "أزرق",
    primary: "#155dfc", primaryFg: "#ffffff",
    secondary: "#dbeafe", secondaryFg: "#155dfc",
    accent: "#dbeafe", accentFg: "#155dfc",
    ring: "#3b82f6",
    sidebar: "#0F2044", sidebarPrimary: "#3b82f6", sidebarRing: "#3b82f6",
    textClass: "text-blue-600", bgClass: "bg-blue-600",
  },
  {
    key: "green", label: "أخضر",
    primary: "#059669", primaryFg: "#ffffff",
    secondary: "#d1fae5", secondaryFg: "#059669",
    accent: "#d1fae5", accentFg: "#059669",
    ring: "#10b981",
    sidebar: "#052e16", sidebarPrimary: "#10b981", sidebarRing: "#10b981",
    textClass: "text-emerald-600", bgClass: "bg-emerald-600",
  },
  {
    key: "purple", label: "بنفسجي",
    primary: "#7C3AED", primaryFg: "#ffffff",
    secondary: "#ede9fe", secondaryFg: "#7C3AED",
    accent: "#ede9fe", accentFg: "#7C3AED",
    ring: "#8b5cf6",
    sidebar: "#2e1065", sidebarPrimary: "#8b5cf6", sidebarRing: "#8b5cf6",
    textClass: "text-violet-600", bgClass: "bg-violet-600",
  },
  {
    key: "red", label: "أحمر",
    primary: "#DC2626", primaryFg: "#ffffff",
    secondary: "#fee2e2", secondaryFg: "#DC2626",
    accent: "#fee2e2", accentFg: "#DC2626",
    ring: "#ef4444",
    sidebar: "#450a0a", sidebarPrimary: "#ef4444", sidebarRing: "#ef4444",
    textClass: "text-red-600", bgClass: "bg-red-600",
  },
  {
    key: "gray", label: "رمادي",
    primary: "#374151", primaryFg: "#ffffff",
    secondary: "#f3f4f6", secondaryFg: "#374151",
    accent: "#f3f4f6", accentFg: "#374151",
    ring: "#6b7280",
    sidebar: "#111827", sidebarPrimary: "#6b7280", sidebarRing: "#6b7280",
    textClass: "text-gray-700", bgClass: "bg-gray-700",
  },
];

/** Apply a palette's colors to :root CSS variables */
function applyTheme(t: ThemePalette, fontSize: number) {
  const root = document.documentElement;
  root.style.setProperty("--primary",                   t.primary);
  root.style.setProperty("--primary-foreground",        t.primaryFg);
  root.style.setProperty("--secondary",                 t.secondary);
  root.style.setProperty("--secondary-foreground",      t.secondaryFg);
  root.style.setProperty("--accent",                    t.accent);
  root.style.setProperty("--accent-foreground",         t.accentFg);
  root.style.setProperty("--ring",                      t.ring);
  root.style.setProperty("--sidebar",                   t.sidebar);
  root.style.setProperty("--sidebar-primary",           t.sidebarPrimary);
  root.style.setProperty("--sidebar-ring",              t.sidebarRing);
  root.style.setProperty("--font-size",                 `${fontSize}px`);
  // Dynamic overrides for hardcoded accent colors across pages
  // We inject a <style id="theme-overrides"> tag
  let styleEl = document.getElementById("theme-overrides") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "theme-overrides";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    /* ── Dynamic accent overrides ── */
    .accent-bg   { background-color: ${t.primary} !important; }
    .accent-text { color: ${t.primary} !important; }
    .accent-border { border-color: ${t.primary} !important; }
    .accent-ring  { --tw-ring-color: ${t.primary} !important; }
    /* Sidebar active item */
    .sidebar-active { background-color: ${t.sidebarPrimary}22 !important; color: ${t.sidebarPrimary} !important; }
    /* Primary buttons / badges using Tailwind bg-blue-600 or bg-[#155dfc] */
    [data-accent] .btn-accent,
    [data-accent="true"] button.bg-blue-600,
    [data-accent="true"] button.bg-\\[\\#155dfc\\] {
      background-color: ${t.primary} !important;
    }
  `;
  root.setAttribute("data-theme", t.key);
}

/* ──────────────────────────────────────────────
   Context
────────────────────────────────────────────── */
interface ThemeCtx {
  theme: ThemePalette;
  fontSize: number;
  setTheme: (key: ThemeKey) => void;
  setFontSize: (size: number) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

const LS_THEME     = "app_theme";
const LS_FONTSIZE  = "app_font_size";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>(
    () => (localStorage.getItem(LS_THEME) as ThemeKey) ?? "blue"
  );
  const [fontSize, setFontSizeState] = useState<number>(
    () => Number(localStorage.getItem(LS_FONTSIZE)) || 14
  );

  const theme = THEMES.find(t => t.key === themeKey) ?? THEMES[0];

  // Apply on mount + whenever theme/fontSize changes
  useEffect(() => {
    applyTheme(theme, fontSize);
  }, [theme, fontSize]);

  const setTheme = (key: ThemeKey) => {
    setThemeKey(key);
    localStorage.setItem(LS_THEME, key);
  };

  const setFontSize = (size: number) => {
    setFontSizeState(size);
    localStorage.setItem(LS_FONTSIZE, String(size));
  };

  return (
    <ThemeContext.Provider value={{ theme, fontSize, setTheme, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
