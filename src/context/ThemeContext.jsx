// src/context/ThemeContext.jsx
// Supports three modes: "system" (default) | "light" | "dark"
// "system" listens to the OS prefers-color-scheme media query in real time.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "theme-mode";

// Helper: read OS preference
const getSystemPrefersDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

// Helper: apply data-theme attribute to <html>
const applyTheme = (dark) => {
  if (dark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
};

// Apply immediately on module load to avoid FOUC
const initialMode = localStorage.getItem(STORAGE_KEY) || "system";
if (initialMode === "dark") applyTheme(true);
else if (initialMode === "light") applyTheme(false);
else applyTheme(getSystemPrefersDark()); // system

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // mode: "system" | "light" | "dark"
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || "system");

  // Derived boolean — used by existing consumers of `isDark`
  const resolvedDark =
    mode === "dark" ? true : mode === "light" ? false : getSystemPrefersDark();

  const [isDark, setIsDark] = useState(resolvedDark);

  // When mode changes: persist + apply
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    if (mode === "system") {
      setIsDark(getSystemPrefersDark());
      applyTheme(getSystemPrefersDark());
    } else {
      const dark = mode === "dark";
      setIsDark(dark);
      applyTheme(dark);
    }
  }, [mode]);

  // Listen to OS changes when in "system" mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (mode === "system") {
        setIsDark(e.matches);
        applyTheme(e.matches);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  // Legacy toggle (used by ProfilePage dark-mode button)
  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      if (prev === "system") return isDark ? "light" : "dark";
      return prev === "dark" ? "light" : "dark";
    });
  }, [isDark]);

  const setThemeMode = useCallback((newMode) => setMode(newMode), []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, mode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (ctx === null) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};
