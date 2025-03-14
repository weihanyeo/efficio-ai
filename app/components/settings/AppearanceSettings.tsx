"use-client";
import React from "react";
import { Moon, Sun, Monitor } from "lucide-react";

export const AppearanceSettings = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Appearance</h2>
      <div className="space-y-6 max-w-2xl">
        {/* Theme Selection */}
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
          ].map((theme) => (
            <button
              key={theme.value}
              className="p-4 bg-[#1E1E1E] rounded-lg border-2 border-transparent hover:border-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <div className="flex flex-col items-center gap-2">
                {theme.icon}
                <span className="text-sm font-medium">{theme.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Font Size</label>
          <input
            type="range"
            min="12"
            max="20"
            defaultValue="16"
            className="w-full h-2 bg-[#262626] rounded-lg appearance-none cursor-pointer"
          />
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
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
