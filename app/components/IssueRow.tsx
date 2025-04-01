'use client';
import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, MessageSquare, GitBranch, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Issue, SupabaseError } from '../types';

interface IssueRowProps {
  issue: Issue;
  onSelect: (issue: Issue) => void;
}

export const IssueRow = ({ issue, onSelect }: IssueRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(issue.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPointsTooltip, setShowPointsTooltip] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = async () => {
    if (title !== issue.title) {
      await updateIssue({ title });
    }
    setIsEditing(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (title !== issue.title) {
        await updateIssue({ title });
      }
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setTitle(issue.title);
      setIsEditing(false);
    }
  };

  const updateIssue = async (updates: Partial<Issue>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('issues')
        .update(updates)
        .eq('id', issue.id) as { error: SupabaseError | null };

      if (error) throw error;
    } catch (error) {
      console.error('Error updating issue:', error);
      // Revert changes on error
      setTitle(issue.title);
    } finally {
      setLoading(false);
    }
  };

  const handlePointsChange = async (direction: 'up' | 'down') => {
    const fibonacci = [1, 2, 3, 5, 8, 13, 21];
    const currentIndex = fibonacci.indexOf(issue.points || 1);
    const newIndex = direction === 'up'
      ? Math.min(currentIndex + 1, fibonacci.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    await updateIssue({ points: fibonacci[newIndex] });
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    await updateIssue({ status: e.target.value as Issue['status'] });
  };

  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    await updateIssue({ priority: e.target.value as Issue['priority'] });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: issue.id,
      title: issue.title,
      status: issue.status
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`group p-3 bg-card border border-border rounded-lg hover:border-border/80 transition-colors cursor-pointer ${
        loading ? 'opacity-50' : ''
      }`}
      onClick={() => !isEditing && onSelect(issue)}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-secondary border border-primary rounded px-2 py-1 text-sm focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
          )}
          <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePointsChange('down');
                  }}
                  className="p-1 hover:bg-muted rounded-l border border-border"
                >
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
                <div className="px-3 py-1 bg-primary/20 text-primary border-y border-border text-sm font-medium">
                  {issue.points || 1} pts
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePointsChange('up');
                  }}
                  className="p-1 hover:bg-muted rounded-r border border-border"
                >
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              <div className="relative">
                <button
                  className="p-1 hover:bg-muted rounded-md"
                  onMouseEnter={() => setShowPointsTooltip(true)}
                  onMouseLeave={() => setShowPointsTooltip(false)}
                >
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </button>
                {showPointsTooltip && (
                  <div className="absolute left-full ml-2 w-64 p-3 bg-card rounded-lg border border-border shadow-lg z-10">
                    <p className="text-sm text-muted-foreground">
                      Points follow the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21) to estimate task complexity.
                      AI suggests points based on similar tasks and historical data.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <select
            value={issue.priority}
            onChange={handlePriorityChange}
            className="bg-secondary border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          <select
            value={issue.status}
            onChange={handleStatusChange}
            className="bg-secondary border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="Todo">Todo</option>
            <option value="InProgress">In Progress</option>
            <option value="InReview">In Review</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{issue.comments?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitBranch className="w-4 h-4" />
            <span>{issue.related_issues?.length || 0}</span>
          </div>
        </div>
        {issue.assignee && (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary group relative">
            {issue.assignee.full_name.charAt(0)}
            <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 whitespace-nowrap bg-card text-foreground text-xs px-2 py-1 rounded border border-border">
              {issue.assignee.full_name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};