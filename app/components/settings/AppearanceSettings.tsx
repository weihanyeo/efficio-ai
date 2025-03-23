"use client"
import React, { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { showSuccess, showError } from "../utils/toast";
import { ToastContainer } from "../ToastContainer";

export const AppearanceSettings = () => {
  // Initialize state with a function to get the value from localStorage on initial render
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
      return savedTheme || "system";
    }
    return "system";
  });
  
  const [fontSize, setFontSize] = useState<number>(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      const savedFontSize = localStorage.getItem("fontSize");
      return savedFontSize ? parseInt(savedFontSize) : 16;
    }
    return 16;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem("theme", theme);

    // Apply theme to document
    if (theme === "system") {
      // Check system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", systemPrefersDark);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle("dark", e.matches);
      };
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Apply light/dark theme directly
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  // Apply font size changes
  useEffect(() => {
    // Save font size preference to localStorage
    localStorage.setItem("fontSize", fontSize.toString());
    
    // Apply font size to document
    document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`);
  }, [fontSize]);

  // Handle theme selection
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  // Handle font size change
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(parseInt(e.target.value));
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Appearance</h2>
      <div className="space-y-6 max-w-2xl">
        {/* Theme Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Theme</label>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: <Sun className="w-5 h-5" />,
                name: "Light",
                value: "light",
              },
              { icon: <Moon className="w-5 h-5" />, name: "Dark", value: "dark" },
              {
                icon: <Monitor className="w-5 h-5" />,
                name: "System",
                value: "system",
              },
            ].map((themeOption) => (
              <button
                key={themeOption.value}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  theme === themeOption.value
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-transparent bg-secondary hover:border-indigo-500"
                }`}
                onClick={() => handleThemeChange(themeOption.value as "light" | "dark" | "system")}
              >
                <div className="flex flex-col items-center gap-2">
                  {themeOption.icon}
                  <span className="text-sm font-medium">{themeOption.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Font Size</label>
            <span className="text-sm font-semibold text-muted-foreground">
              {fontSize}px
            </span>
          </div>
          <div className="relative w-full">
            <input
              type="range"
              min="12"
              max="20"
              value={fontSize}
              onChange={handleFontSizeChange}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-4 
                [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:bg-primary 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:shadow-md
                hover:[&::-webkit-slider-thumb]:scale-110
                transition-transform"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Small</span>
              <span>Medium</span>
              <span>Large</span>
            </div>
          </div>
        </div>

        {/* Density */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Interface Density</label>
          <div className="flex gap-4">
            {["Comfortable", "Compact", "Custom"].map((density) => (
              <button
                key={density}
                className="px-4 py-2 bg-muted rounded-md text-sm hover:bg-border transition-colors"
              >
                {density}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
