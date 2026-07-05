"use client";
import { createContext, useContext, useCallback, useSyncExternalStore } from "react";

const ThemeContext = createContext();

// The .dark class on <html> is the source of truth — it's applied before paint
// by the blocking script in the root layout. We read it via useSyncExternalStore
// so there's no flash and no setState-in-effect / hydration mismatch.
function subscribe(callback) {
    window.addEventListener("themechange", callback);
    return () => window.removeEventListener("themechange", callback);
}

function getSnapshot() {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot() {
    return "light";
}

export function ThemeProvider({ children }) {
    const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const toggleTheme = useCallback(() => {
        const newTheme = theme === "light" ? "dark" : "light";
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        window.dispatchEvent(new Event("themechange"));
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
