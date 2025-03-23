"use client"
import React from 'react';
import { Command } from 'lucide-react';

export const ShortcutSettings = () => {
  const shortcuts = [
    { category: 'Navigation',
      items: [
        { action: 'Open Command Palette', keys: ['⌘', 'K'] },
        { action: 'Go to Dashboard', keys: ['G', 'D'] },
        { action: 'Go to Projects', keys: ['G', 'P'] },
        { action: 'Go to Settings', keys: ['G', 'S'] }
      ]
    },
    { category: 'Issues',
      items: [
        { action: 'Create New Issue', keys: ['C', 'I'] },
        { action: 'Quick Search', keys: ['⌘', 'F'] },
        { action: 'Filter Issues', keys: ['⌘', 'L'] },
        { action: 'Toggle View', keys: ['⌘', 'V'] }
      ]
    },
    { category: 'AI Assistant',
      items: [
        { action: 'Toggle AI Panel', keys: ['⌘', '\\'] },
        { action: 'Generate Summary', keys: ['⌘', 'G'] },
        { action: 'Quick Suggestions', keys: ['⌘', 'Space'] },
        { action: 'Explain Code', keys: ['⌘', 'E'] }
      ]
    }
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Keyboard Shortcuts</h2>
      <div className="space-y-6 max-w-2xl">
        <div className="p-4 bg-secondary rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Command className="w-5 h-5 text-indigo-400" />
            <h3 className="font-medium">Available Shortcuts</h3>
          </div>
          
          <div className="space-y-6">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h4 className="text-sm font-medium text-gray-400 mb-3">{category.category}</h4>
                <div className="space-y-2">
                  {category.items.map((shortcut) => (
                    <div key={shortcut.action} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                      <span className="text-sm">{shortcut.action}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, index) => (
                          <React.Fragment key={index}>
                            <kbd className="px-2 py-1 bg-muted border border-border rounded text-sm">
                              {key}
                            </kbd>
                            {index < shortcut.keys.length - 1 && <span className="text-gray-400">+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};