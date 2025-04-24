"use client"

import React, { useEffect, useState, useRef } from 'react';
import { Bot, X, Sparkles, Brain, GitPullRequest, AlertTriangle, Clock, Plus, Wand2, Send, 
  Calendar, Users, BookOpen, ExternalLink, Star, BarChart, TrendingUp, UserCheck, 
  AlertCircle, CheckCircle, Circle, BookMarked, Timer, ArrowRight } from 'lucide-react';
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
        ) : activeTab === 'suggestions' ? (
          <div className="space-y-4">
            {/* Task Recommendations */}
            <div className="p-3 bg-secondary rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-primary" />
                Prioritized Tasks
              </h3>
              <ul className="space-y-3">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      className="p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {getSuggestionIcon(suggestion.type)}
                          {/* Importance indicator */}
                          <div className="mt-1 flex justify-center">
                            <Star className={`w-3 h-3 ${suggestion.priority <= 2 ? 'text-red-400' : suggestion.priority <= 4 ? 'text-yellow-400' : 'text-green-400'}`} />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                          <p className="text-xs text-primary mt-1 italic">
                            {suggestion.priority <= 2 
                              ? 'High priority: Blocking other tasks' 
                              : suggestion.priority <= 4 
                                ? 'Medium priority: Important for sprint goals' 
                                : 'Regular priority: Enhances product quality'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleImplementSuggestion(suggestion.id)}
                          className="flex-1 px-3 py-1.5 bg-primary/10 text-xs text-primary rounded hover:bg-primary/20 transition-colors font-medium"
                        >
                          {suggestion.action}
                        </button>
                        <button
                          className="px-3 py-1.5 bg-muted text-xs text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                        >
                          Later
                        </button>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-center text-muted-foreground">
                    No task recommendations available
                  </li>
                )}
              </ul>
            </div>

            {/* Resource Suggestions */}
            <div className="p-3 bg-secondary rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Resource Suggestions
              </h3>
              <div className="space-y-3">
                <div className="p-2 rounded-md bg-muted/50">
                  <div className="flex items-start gap-2">
                    <BookMarked className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">React Context API Documentation</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Relevant to your current workspace context implementation</p>
                      <a href="#" className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline">
                        View resource <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 rounded-md bg-muted/50">
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-indigo-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Collaboration Opportunity</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Sarah is working on a related component</p>
                      <button className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline">
                        Message Sarah <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 rounded-md bg-muted/50">
                  <div className="flex items-start gap-2">
                    <Brain className="w-4 h-4 text-purple-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">AI Design Pattern Library</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">UI patterns for dashboard components</p>
                      <a href="#" className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline">
                        View resource <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Management */}
            <div className="p-3 bg-secondary rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-400" />
                Time Management
              </h3>
              <div className="space-y-3">
                <div className="p-2 rounded-md bg-muted/50">
                  <div className="flex items-start gap-2">
                    <Timer className="w-4 h-4 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Focus Block Recommendation</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">2-hour deep work session for UI implementation</p>
                      <button className="mt-2 px-3 py-1 bg-primary/10 text-xs text-primary rounded hover:bg-primary/20 transition-colors">
                        Schedule Focus Time
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 rounded-md bg-muted/50">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-orange-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Upcoming Meeting</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Sprint Planning in 45 minutes</p>
                      <div className="flex gap-2 mt-2">
                        <button className="px-3 py-1 bg-primary/10 text-xs text-primary rounded hover:bg-primary/20 transition-colors">
                          Prepare Agenda
                        </button>
                        <button className="px-3 py-1 bg-muted text-xs text-muted-foreground rounded hover:bg-muted/80 transition-colors">
                          Snooze
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Insights Tab
          <div className="space-y-4">
            {/* Sprint Progress */}
            <div className="p-3 bg-secondary rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <BarChart className="w-4 h-4 text-primary" />
                Sprint Progress
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Overall Completion</span>
                    <span className="text-foreground font-medium">65%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-primary rounded-full" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">5 days remaining in sprint</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="p-2 bg-muted/50 rounded-md text-center">
                    <div className="flex justify-center mb-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-xs font-medium">12</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md text-center">
                    <div className="flex justify-center mb-1">
                      <Circle className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-xs font-medium">5</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md text-center">
                    <div className="flex justify-center mb-1">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                    </div>
                    <p className="text-xs font-medium">2</p>
                    <p className="text-xs text-muted-foreground">Blocked</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Metrics */}
            <div className="p-3 bg-secondary rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Team Metrics
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Story Points</span>
                    <span className="text-foreground font-medium">32/45 points</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[71%] bg-indigo-400 rounded-full" />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-xs font-medium">Velocity Trend: +12%</p>
                    <p className="text-xs text-muted-foreground">Improving from last sprint</p>
                  </div>
                </div>
                
                <div className="p-2 bg-muted/50 rounded-md">
                  <h4 className="text-xs font-medium mb-2">Task Completion Rate</h4>
                  <div className="flex h-4 rounded-full overflow-hidden">
                    <div className="bg-green-400 w-[60%]" />
                    <div className="bg-blue-400 w-[25%]" />
                    <div className="bg-yellow-400 w-[15%]" />
                  </div>
                  <div className="flex text-xs mt-1 justify-between">
                    <span className="text-muted-foreground">On Time: 60%</span>
                    <span className="text-muted-foreground">Late: 25%</span>
                    <span className="text-muted-foreground">Overdue: 15%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Performance */}
            <div className="p-3 bg-secondary rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-400" />
                Personal Performance
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted/50 rounded-md text-center">
                    <p className="text-sm font-medium">8</p>
                    <p className="text-xs text-muted-foreground">Tasks Completed</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md text-center">
                    <p className="text-sm font-medium">15</p>
                    <p className="text-xs text-muted-foreground">Story Points</p>
                  </div>
                </div>
                
                <div className="p-2 bg-muted/50 rounded-md">
                  <h4 className="text-xs font-medium mb-1">Comparison to Team Average</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[120%] bg-green-400 rounded-full" />
                    </div>
                    <span className="text-xs text-green-400 font-medium">+20%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">You're performing above team average</p>
                </div>
                
                <div className="p-2 bg-muted/50 rounded-md">
                  <h4 className="text-xs font-medium mb-1">Focus Areas</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      Strong in: Frontend implementation
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                      Opportunity: API integration
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Risk Indicators */}
            <div className="p-3 bg-secondary rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Risk Indicators
              </h3>
              <div className="space-y-3">
                <div className="p-2 bg-yellow-400/10 border border-yellow-400/30 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-500">Medium Risk: API Dependencies</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">External API integration may delay task completion</p>
                      <button className="mt-2 px-3 py-1 bg-yellow-400/20 text-xs text-yellow-600 rounded hover:bg-yellow-400/30 transition-colors">
                        Review Dependencies
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-green-400/10 border border-green-400/30 rounded-md">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-500">Low Risk: Testing Coverage</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Unit tests are up to date with recent changes</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-red-400/10 border border-red-400/30 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-500">High Risk: Deadline Approaching</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Authentication feature due in 2 days with 40% remaining</p>
                      <button className="mt-2 px-3 py-1 bg-red-400/20 text-xs text-red-600 rounded hover:bg-red-400/30 transition-colors">
                        Request Help
                      </button>
                    </div>
                  </div>
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
            className="w-full pl-4 pr-10 py-2 rounded-md bg-secondary border border-muted focus:outline-none focus:border-primary"
          />
          <Bot className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 transform -translate-y-1/2" />
          
          {showCommandHelp && (
            <div className="command-help absolute bottom-full left-0 right-0 mb-2 bg-secondary border border-muted rounded-lg overflow-hidden shadow-lg">
              <div className="p-3 border-b border-muted border-border">
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