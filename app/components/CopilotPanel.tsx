"use client"

import React, { useEffect, useState, useRef } from 'react';
import { Bot, X, Sparkles, Brain, GitPullRequest, AlertTriangle, Clock, Plus, Wand2, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { AISuggestion } from '../types';

interface CommandSuggestion {
  icon: React.ReactNode;
  text: string;
  example: string;
}

const commandSuggestions: CommandSuggestion[] = [
  {
    icon: <Plus className="w-4 h-4 text-green-400" />,
    text: "Create a new task",
    example: '"Add user authentication" or "Fix login bug"',
  },
  {
    icon: <GitPullRequest className="w-4 h-4 text-indigo-400" />,
    text: "Create related task",
    example: '"Add task related to auth flow"',
  },
  {
    icon: <Wand2 className="w-4 h-4 text-purple-400" />,
    text: "Generate from description",
    example: '"Create tasks from this: implement user roles and permissions"',
  },
];

export const CopilotPanel: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'insights'>('suggestions');
  const [showCommandHelp, setShowCommandHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { currentWorkspace } = useWorkspace();
  const pollInterval = useRef<NodeJS.Timeout>();
  const previousSuggestionsRef = useRef<AISuggestion[]>([]);

  useEffect(() => {
    if (!currentWorkspace) return;

    const loadSuggestions = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_suggestions')
          .select(`
            *,
            context:ai_suggestion_contexts(
              context_type,
              context_id
            )
          `)
          .eq('workspace_id', currentWorkspace.id)
          .eq('is_implemented', false)
          .order('priority', { ascending: true })
          .limit(10);

        if (error) throw error;

        if (data) {
          // Only update if suggestions have actually changed
          const newSuggestions = data as AISuggestion[];
          if (JSON.stringify(previousSuggestionsRef.current) !== JSON.stringify(newSuggestions)) {
            previousSuggestionsRef.current = newSuggestions;
            setSuggestions(newSuggestions);
          }
        }
      } catch (err) {
        console.error('Error loading suggestions:', err);
        setError('Failed to load suggestions');
      }
    };

    // Initial load with loading state
    setLoading(true);
    loadSuggestions().finally(() => setLoading(false));

    // Set up polling without loading state
    pollInterval.current = setInterval(loadSuggestions, 10000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [currentWorkspace]);

  const handleImplementSuggestion = async (suggestionId: string) => {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ is_implemented: true })
        .eq('id', suggestionId);

      if (error) throw error;

      setSuggestions(prev =>
        prev.filter(s => s.id !== suggestionId)
      );
    } catch (error) {
      console.error('Error implementing suggestion:', error);
    }
  };

  const handleInputFocus = () => {
    setShowCommandHelp(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Keep help visible if clicking inside the help panel
    if (e.relatedTarget && e.relatedTarget.closest(".command-help")) {
      inputRef.current?.focus();
      return;
    }
    setShowCommandHelp(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowCommandHelp(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-indigo-600 rounded-full hover:bg-indigo-700 shadow-lg"
      >
        <Bot className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`w-80 border-l border-[#262626] bg-[#161616] flex flex-col min-w-[300px] ${className}`}>
      <div className="p-4 border-b border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-[#262626] rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="border-b border-[#262626]">
        <div className="flex">
          <button
            onClick={() => setActiveTab("suggestions")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "suggestions"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "insights"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Insights
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {loading ? (
          <div className="text-center py-4 text-gray-400">
            Loading...
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-400">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-[#262626] rounded-lg">
              <h3 className="font-medium mb-3">
                {activeTab === 'suggestions' ? 'Recommended Actions' : 'Sprint Analysis'}
              </h3>
              <ul className="space-y-3">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      className="p-2 rounded-md hover:bg-[#363636] cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        {getSuggestionIcon(suggestion.type)}
                        <div>
                          <h4 className="text-sm font-medium text-white">{suggestion.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">{suggestion.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleImplementSuggestion(suggestion.id)}
                        className="w-full mt-2 px-3 py-1.5 bg-[#363636] text-xs text-gray-300 rounded hover:bg-[#404040] transition-colors"
                      >
                        {suggestion.action}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-center text-gray-400">
                    No suggestions available
                  </li>
                )}
              </ul>
            </div>

            <div className="p-3 bg-[#262626] rounded-lg">
              <h3 className="font-medium mb-3">Sprint Insights</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Sprint Progress</span>
                    <span className="text-white">65%</span>
                  </div>
                  <div className="h-1.5 bg-[#363636] rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-indigo-500 rounded-full" />
                  </div>
                </div>
                
                <div className="text-sm">
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      Consider adding 2-3 more tasks to maintain velocity
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                      Review blocked tasks in the next standup
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#262626]">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Describe a task or type / for commands..."
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="w-full pl-4 pr-10 py-2 bg-[#262626] border border-[#363636] rounded-md text-sm focus:outline-none focus:border-indigo-500"
          />
          <Bot className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
          
          {showCommandHelp && (
            <div className="command-help absolute bottom-full left-0 right-0 mb-2 bg-[#262626] border border-[#363636] rounded-lg overflow-hidden shadow-lg">
              <div className="p-3 border-b border-[#363636]">
                <h4 className="text-sm font-medium mb-1">
                  Quick Task Creation
                </h4>
                <p className="text-xs text-gray-400">
                  Just start typing naturally - AI will understand your intent
                </p>
              </div>
              <div className="p-2">
                {commandSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full p-2 text-left rounded hover:bg-[#363636] transition-colors flex items-start gap-3"
                  >
                    {suggestion.icon}
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        {suggestion.text}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Try: {suggestion.example}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-3 bg-[#1E1E1E] border-t border-[#363636]">
                <p className="text-xs text-gray-400 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  AI will help break down complex tasks and suggest related
                  items
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
          <Bot className="w-3 h-3" />
          Try: "Create a task for implementing OAuth" or "Add related security
          tasks"
        </div>
      </div>
    </div>
  );
};

const getSuggestionIcon = (type: AISuggestion['type']) => {
  switch (type) {
    case 'task':
      return <GitPullRequest className="w-4 h-4 text-indigo-400" />;
    case 'optimization':
      return <Sparkles className="w-4 h-4 text-yellow-400" />;
    case 'insight':
      return <Brain className="w-4 h-4 text-purple-400" />;
    case 'automation':
      return <Clock className="w-4 h-4 text-green-400" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-orange-400" />;
  }
};