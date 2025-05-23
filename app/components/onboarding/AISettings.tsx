"use client";
import React from 'react';
import { Bot, Brain, Sparkles, Settings, Lock } from 'lucide-react';

export const AISettings = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">AI Assistant Settings</h2>
      <div className="space-y-6 max-w-2xl">
        {/* AI Capabilities */}
        <div className="p-4 bg-secondary rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="font-medium">AI Capabilities</h3>
          </div>
          <div className="space-y-3">
            {[
              { feature: 'Automatic Task Breakdown', description: 'AI suggests how to split large tasks' },
              { feature: 'Code Analysis', description: 'AI reviews and suggests improvements for code' },
              { feature: 'Context Awareness', description: 'AI understands project context for better suggestions' },
              { feature: 'Natural Language Processing', description: 'Communicate with AI in plain English' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div>
                  <p className="font-medium">{item.feature}</p>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="p-4 bg-secondary rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Privacy Settings</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Data Collection</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <p className="text-sm text-gray-400">Allow AI to learn from your usage patterns to improve suggestions</p>
            </div>
          </div>
        </div>

        {/* Model Settings */}
        <div className="p-4 bg-secondary rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Model Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Response Length</label>
              <select className="w-full px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                <option>Concise</option>
                <option>Balanced</option>
                <option>Detailed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Creativity Level</label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="70"
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>Conservative</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80">
            Save AI Settings
          </button>
        </div>
      </div>
    </div>
  );
};