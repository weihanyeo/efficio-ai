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
    icon: <GitPullRequest className="w-4 h-4 text-primary" />,
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
  const pollInterval = useRef<NodeJS.Timeout | undefined>(undefined);
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
        className="fixed bottom-4 right-4 p-3 bg-primary rounded-full hover:bg-primary/80 shadow-lg"
      >
        <Bot className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`w-80 border-l border-border bg-card flex flex-col min-w-[300px] ${className}`}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-secondary rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab("suggestions")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "suggestions"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "insights"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Insights
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading...
          </div>
        ) : error ? (
          <div className="text-center py-4 text-destructive">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-secondary rounded-lg">
              <h3 className="font-medium mb-3">
                {activeTab === 'suggestions' ? 'Recommended Actions' : 'Sprint Analysis'}
              </h3>
              <ul className="space-y-3">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      className="p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        {getSuggestionIcon(suggestion.type)}
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleImplementSuggestion(suggestion.id)}
                        className="w-full mt-2 px-3 py-1.5 bg-muted text-xs text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                      >
                        {suggestion.action}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-center text-muted-foreground">
                    No suggestions available
                  </li>
                )}
              </ul>
            </div>

            <div className="p-3 bg-secondary rounded-lg">
              <h3 className="font-medium mb-3">Sprint Insights</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Sprint Progress</span>
                    <span className="text-foreground">65%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-primary rounded-full" />
                  </div>
                </div>
                
                <div className="text-sm">
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="space-y-2 text-muted-foreground">
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

      <div className="p-4 border-t border-border">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Describe a task or type / for commands..."
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="w-full pl-4 pr-10 py-2 bg-secondary border border-muted focus:outline-none focus:border-primary"
          />
          <Bot className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 transform -translate-y-1/2" />
          
          {showCommandHelp && (
            <div className="command-help absolute bottom-full left-0 right-0 mb-2 bg-secondary border border-muted rounded-lg overflow-hidden shadow-lg">
              <div className="p-3 border-b border-muted">
                <h4 className="text-sm font-medium mb-1">
                  Quick Task Creation
                </h4>
                <p className="text-xs text-muted-foreground">
                  Just start typing naturally - AI will understand your intent
                </p>
              </div>
              <div className="p-2">
                {commandSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full p-2 text-left rounded hover:bg-muted transition-colors flex items-start gap-3"
                  >
                    {suggestion.icon}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {suggestion.text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Try: {suggestion.example}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-3 bg-muted border-t border-muted">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  AI will help break down complex tasks and suggest related
                  items
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
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
      return <GitPullRequest className="w-4 h-4 text-primary" />;
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