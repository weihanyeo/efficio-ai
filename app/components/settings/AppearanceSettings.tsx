"use client"
import React, { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

export const AppearanceSettings = () => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [fontSize, setFontSize] = useState<number>(16);

  // Initialize theme and font size from localStorage on component mount
  useEffect(() => {
    // Get theme preference from localStorage or default to system
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Get font size preference from localStorage or default to 16
    const savedFontSize = localStorage.getItem("fontSize");
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize));
    }
  }, []);

  // Apply theme changes
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

  // Handle save preferences
  const handleSavePreferences = () => {
    // Preferences are already saved in localStorage via useEffect hooks
    // This is just for UX feedback
    alert("Preferences saved successfully!");
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
                    : "border-transparent bg-[#1E1E1E] hover:border-indigo-500"
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
        <div className="space-y-2">
          <label className="block text-sm font-medium">Font Size</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="12"
              max="20"
              value={fontSize}
              onChange={handleFontSizeChange}
              className="w-full h-2 bg-[#262626] rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium min-w-[40px]">{fontSize}px</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Small</span>
            <span>Medium</span>
            <span>Large</span>
          </div>
        </div>

        {/* Density */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Interface Density</label>
          <div className="flex gap-4">
            {["Comfortable", "Compact", "Custom"].map((density) => (
              <button
                key={density}
                className="px-4 py-2 bg-[#262626] rounded-md text-sm hover:bg-[#363636] transition-colors"
              >
                {density}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            onClick={handleSavePreferences}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
