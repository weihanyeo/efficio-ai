'use client';
import React, { useEffect, useState } from 'react';
import {
  Bot,
  GitBranch,
  Link2,
  ChevronDown,
  Edit3,
  Users,
  Tag,
  GitCommit,
  Send,
  Trash2,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Issue, Comment, Profile, IssueLabel, DatabaseIssue, SupabaseError } from '../types';
import { User } from '@supabase/supabase-js';

interface RelatedIssueCardProps {
  title: string;
  status: string;
  priority: string;
  description: string;
}

const RelatedIssueCard = ({ title, status, priority, description }: RelatedIssueCardProps) => (
  <div className="p-4 bg-card border border-border rounded-lg hover:bg-secondary cursor-pointer transition-colors">
    <div className="flex items-start justify-between mb-2">
      <h4 className="font-medium text-sm text-foreground">{title}</h4>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
          {status}
        </span>
        <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded-full">
          {priority}
        </span>
      </div>
    </div>
    <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
  </div>
);

interface AssigneeSelectorProps {
  currentAssigneeId?: string;
  onAssigneeChange: (assigneeId: string) => void;
  workspaceId: string;
}

interface MemberRow {
  member: Profile;
}

const AssigneeSelector = ({ currentAssigneeId, onAssigneeChange, workspaceId }: AssigneeSelectorProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [members, setMembers] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('workspace_members')
          .select(`
            member:profiles(*)
          `)
          .eq('workspace_id', workspaceId) as { data: MemberRow[] | null; error: SupabaseError | null };

        if (error) throw error;

        setMembers(data?.map(d => d.member as Profile) || []);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Assignees</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-muted rounded-md"
        >
          <Users className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {currentAssigneeId && members.map(member => {
          if (member.id === currentAssigneeId) {
            return (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group cursor-pointer"
              >
                {member.full_name.charAt(0)}
                <div className="hidden group-hover:flex absolute items-center bg-muted text-foreground text-xs px-2 py-1 rounded -mt-8">
                  {member.full_name}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-muted border border-border rounded-lg shadow-lg">
          <div className="p-2 max-h-48 overflow-auto">
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => {
                  onAssigneeChange(member.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2 hover:bg-border rounded-md group"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">
                  {member.full_name.charAt(0)}
                </div>
                <span className="text-sm text-gray-200">{member.full_name}</span>
                {currentAssigneeId === member.id && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface IssueDetailProps {
  issue: Issue;
  onClose: () => void;
}

export const IssueDetail = ({ issue, onClose }: IssueDetailProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'docs'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullIssue, setFullIssue] = useState<DatabaseIssue>(issue as DatabaseIssue);
  const [comments, setComments] = useState<(Comment & { author?: Profile })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [labels, setLabels] = useState<IssueLabel[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [isLabelSelectorOpen, setIsLabelSelectorOpen] = useState(false);
  const [activeReplyId, setActiveReplyId] = React.useState<string | null>(null);
  const [replyContents, setReplyContents] = React.useState<Record<string, string>>({});

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchIssueDetails = async () => {
      try {
        // Fetch full issue with relations
        const { data: issueData, error: issueError } = await supabase
          .from('issues')
          .select(`
            *,
            assignee:profiles(*),
            comments(
              *,
              author:profiles(*)
            ),
            labels:issue_label_assignments(
              label:issue_labels(*)
            ),
            source_relationships:issue_relationships!issue_relationships_source_issue_id_fkey(
              relationship_type,
              target_issue:issues!issue_relationships_target_issue_id_fkey(*)
            ),
            target_relationships:issue_relationships!issue_relationships_target_issue_id_fkey(
              relationship_type,
              source_issue:issues!issue_relationships_source_issue_id_fkey(*)
            ),
            project:projects(workspace_id)
          `)
          .eq('id', issue.id)
          .single() as { data: DatabaseIssue | null; error: SupabaseError | null };

        if (issueError) throw issueError;

        // Fetch all available labels
        const { data: labelsData, error: labelsError } = await supabase
          .from('issue_labels')
          .select('*') as { data: IssueLabel[] | null; error: SupabaseError | null };

        if (labelsError) throw labelsError;

        if (issueData) {
          setFullIssue(issueData);
          setComments(issueData.comments || []);
          setLabels(labelsData || []);
          setSelectedLabels(issueData.labels?.map(l => l.label.id) || []);
        }
      } catch (error) {
        console.error('Error fetching issue details:', error);
        setError('Failed to load issue details');
      } finally {
        setLoading(false);
      }
    };

    fetchIssueDetails();
    subscribeToUpdates();

    return () => {
      supabase.removeAllChannels();
    };
  }, [issue.id]);

  const subscribeToUpdates = () => {
    // Subscribe to issue updates
    const issueChannel = supabase
      .channel('issue_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `id=eq.${issue.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setFullIssue(prev => ({ ...prev, ...payload.new }));
          }
        }
      )
      .subscribe();

    // Subscribe to new comments
    const commentChannel = supabase
      .channel('issue_comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `issue_id=eq.${issue.id}`,
        },
        async (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              const { data: authorData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', payload.new.author_id)
                .single();

              setComments(prev => [
                ...prev.filter(c => c.id !== payload.new.id),
                { ...payload.new, author: authorData } as unknown as Comment & { author?: Profile }
              ].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ));
            }
            else if (payload.eventType === 'UPDATE') {
              setComments(prev => prev.map(c =>
                c.id === payload.new.id ? {
                  ...c,
                  content: payload.new.content,
                  is_edited: payload.new.is_edited,
                  is_deleted: payload.new.is_deleted,
                  updated_at: payload.new.updated_at
                } : c
              ));
            }
            else if (payload.eventType === 'DELETE') {
              setComments(prev => prev.filter(c => c.id !== payload.old.id));
            }
          } catch (error) {
            console.error('Error handling comment update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      issueChannel.unsubscribe();
      commentChannel.unsubscribe();
    };
  };

  const handleAddComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

      const optimisticComment: Comment & { author?: Profile } = {
        id: `optimistic-${Date.now()}`,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author_id: user.id,
        issue_id: issue.id,
        parent_id: parentId, 
        is_edited: false,
        is_deleted: false,
        author: {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'You',
          avatar_url: user.user_metadata?.avatar_url || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email: ''
        }
      };

      setComments(prev => [...prev, optimisticComment].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));

      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          issue_id: issue.id,
          content,
          author_id: user.id,
          parent_id: parentId 
        });

      if (commentError) throw commentError;

    } catch (error) {
      console.error('Failed to add comment:', error);
      setComments(prev => prev.filter(c => c.id !== `optimistic-${Date.now()}`));
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, content: newContent, is_edited: true } : c
      ));

      const { error } = await supabase
        .from('comments')
        .update({
          content: newContent,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to edit comment:', error);
      // Revert optimistic update on error
      setComments(prev => prev);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, content: 'This message has been deleted by sender', is_deleted: true } : c
      ));
      const { error } = await supabase
        .from('comments')
        .update({
          is_deleted: true,
          content: 'This message has been deleted by sender',
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete comment:', error);
      setComments(prev => prev);
    };
  };


  const handleAssigneeChange = async (assigneeId: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ assignee_id: assigneeId })
        .eq('id', issue.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update assignee:', error);
    }
  };

  const handleLabelToggle = async (labelId: string) => {
    try {
      if (selectedLabels.includes(labelId)) {
        // Remove label
        const { error } = await supabase
          .from('issue_label_assignments')
          .delete()
          .eq('issue_id', issue.id)
          .eq('label_id', labelId);

        if (error) throw error;

        setSelectedLabels(prev => prev.filter((id: string) => id !== labelId));
      } else {
        // Add label
        const { error } = await supabase
          .from('issue_label_assignments')
          .insert({
            issue_id: issue.id,
            label_id: labelId
          });

        if (error) throw error;

        setSelectedLabels(prev => [...prev, labelId]);
      }
    } catch (error) {
      console.error('Failed to toggle label:', error);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !fullIssue) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="text-foreground">{error || 'Issue not found'}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-overlay z-50 flex items-center justify-center bg-black/50" onClick={handleBackgroundClick}>
      <div className="w-full max-w-4xl h-[90vh] bg-background rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{issue.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 pb-2 flex items-center gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`pb-2 text-sm font-medium border-b-2 ${
                activeTab === 'docs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              Documentation
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="flex gap-6 p-6">
            {/* Main Content */}
            <div className="flex-1">
              {activeTab === 'overview' ? (
                <div className="space-y-8">
                  {/* Status and Priority */}
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded-full">
                      {issue.status}
                    </span>
                    <span className="px-3 py-1 text-sm bg-orange-500/20 text-orange-400 rounded-full">
                      {issue.priority}
                    </span>
                  </div>

                  {/* AI Summary */}
                  <div className="p-4 bg-secondary rounded-lg border border-border">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" />
                      Context Summary
                    </h3>
                    <p className="text-sm text-foreground">
                      {issue.ai_summary || 'AI summary not available'}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="prose max-w-none">
                    <p className="text-foreground">{issue.description}</p>
                  </div>

                  {/* Comments */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Comments</h3>
                    <div className="space-y-4">
                      {comments
                        .filter(comment => !comment.parent_id) // Only show top-level comments
                        .map((parentComment) => (
                          <div key={parentComment.id} className="space-y-2">
                            {/* Parent Comment */}
                            <div className="p-4 bg-secondary rounded-lg relative group">
                              {/* Comment Header */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                  {parentComment.author?.full_name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                  {parentComment.author?.full_name}
                                  {parentComment.is_edited && !parentComment.is_deleted && (
                                    <span className="text-xs text-muted-foreground ml-2">(edited)</span>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(parentComment.created_at).toLocaleString()}
                                </span>

                                {/* Edit/Delete Buttons (for author) */}
                                {parentComment.author_id === user?.id && !parentComment.is_deleted && (
                                  <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        const newContent = prompt('Edit your comment:', parentComment.content);
                                        if (newContent && newContent !== parentComment.content) {
                                          handleEditComment(parentComment.id, newContent);
                                        }
                                      }}
                                      className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this comment?')) {
                                          handleDeleteComment(parentComment.id);
                                        }
                                      }}
                                      className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Comment Content */}
                              <p className={`text-sm ${parentComment.is_deleted ? 'text-muted-foreground italic' : 'text-foreground'
                                }`}>
                                {parentComment.is_deleted ? 'This message has been deleted by sender' : parentComment.content}
                              </p>

                              {/* Reply Button */}
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => setActiveReplyId(activeReplyId === parentComment.id ? null : parentComment.id)}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Reply
                                </button>
                              </div>

                              {/* Reply Input */}
                              {activeReplyId === parentComment.id && (
                                <div className="mt-3 ml-6 flex gap-2">
                                  <input
                                    value={replyContents[parentComment.id] || ''}
                                    onChange={(e) => setReplyContents(prev => ({
                                      ...prev,
                                      [parentComment.id]: e.target.value
                                    }))}
                                    placeholder="Write a reply..."
                                    className="flex-1 px-2 py-1 text-sm bg-muted border border-border rounded-md"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        handleAddComment(replyContents[parentComment.id], parentComment.id);
                                        setReplyContents(prev => ({ ...prev, [parentComment.id]: '' }));
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      handleAddComment(replyContents[parentComment.id], parentComment.id);
                                      setReplyContents(prev => ({ ...prev, [parentComment.id]: '' }));
                                    }}
                                    className="px-2 py-1 bg-indigo-600 rounded-md hover:bg-indigo-700"
                                  >
                                    Send
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Child Comments (Replies) */}
                            {comments
                              .filter(reply => reply.parent_id === parentComment.id)
                              .map((reply) => (
                                <div key={reply.id} className="ml-6 border-l-2 border-border pl-4">
                                  <div className="p-3 bg-card rounded-lg">
                                    {/* Reply Header */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">
                                        {reply.author?.full_name.charAt(0)}
                                      </div>
                                      <span className="text-sm font-medium">
                                        {reply.author?.full_name}
                                        {reply.is_edited && !reply.is_deleted && (
                                          <span className="text-xs text-gray-500 ml-2">(edited)</span>
                                        )}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(reply.created_at).toLocaleString()}
                                      </span>

                                      {/* Edit/Delete Buttons (for reply author) */}
                                      {reply.author_id === user?.id && !reply.is_deleted && (
                                        <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => {
                                              const newContent = prompt('Edit your reply:', reply.content);
                                              if (newContent && newContent !== reply.content) {
                                                handleEditComment(reply.id, newContent);
                                              }
                                            }}
                                            className="p-1 hover:bg-muted rounded-md text-gray-400 hover:text-foreground"
                                          >
                                            <Edit3 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (window.confirm('Are you sure you want to delete this reply?')) {
                                                handleDeleteComment(reply.id);
                                              }
                                            }}
                                            className="p-1 hover:bg-muted rounded-md text-gray-400 hover:text-red-400"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Reply Content */}
                                    <p className={`text-sm ${reply.is_deleted ? 'text-gray-500 italic' : 'text-gray-300'
                                      }`}>
                                      {reply.is_deleted ? 'This message has been deleted by sender' : reply.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ))}
                    </div>
                    <div className="relative flex items-center gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-4 py-2 bg-muted border border-border rounded-md text-sm focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(newComment);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(newComment)}
                        className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-700 text-primary-foreground"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Documentation</h3>
                      <p className="text-xs text-gray-400 mt-1">Auto-generated from commits and discussions</p>
                    </div>
                    <button className="p-2 hover:bg-muted rounded-md">
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* GitHub Integration Notice */}
                  <div className="p-3 bg-cardrounded-lg border border-border flex items-start gap-3">
                    <GitBranch className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium mb-1">Connect to GitHub</h4>
                      <p className="text-xs text-gray-400">
                        Link your GitHub repository to automatically sync documentation with PRs,
                        commits, and code changes. Documentation will be enriched with implementation
                        details and technical context.
                      </p>
                      <button className="mt-3 px-3 py-1.5 bg-muted text-sm text-indigo-400 rounded-md hover:bg-border transition-colors">
                        Connect Repository
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <h1>{issue.title} Documentation</h1>
                    <div className="text-sm text-gray-400 flex items-center gap-2 not-prose mb-6">
                      <GitCommit className="w-4 h-4" />
                      Last updated from commit <code className="px-1.5 py-0.5 bg-muted rounded">feat/auth-flow</code>
                    </div>

                    <h2>Overview</h2>
                    <p>{issue.description}</p>
                    <h2>Technical Details</h2>
                    <ul>
                      <li>Implementation details will go here</li>
                      <li>Architecture decisions</li>
                      <li>API specifications</li>
                    </ul>
                    <h2>Related Resources</h2>
                    <ul>
                      <li>Links to external documentation</li>
                      <li>References to other tasks</li>
                    </ul>

                    <div className="not-prose mt-8 p-3 bg-secondary rounded-lg border border-border">
                      <p className="text-xs text-gray-400">
                        <Bot className="w-4 h-4 text-indigo-400 inline-block mr-2" />
                        Documentation is automatically kept up to date with your codebase. You can also
                        manually edit it to add additional context, examples, or clarifications.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-80 space-y-6">
              {/* Assignees */}
              <AssigneeSelector
                currentAssigneeId={issue.assignee_id}
                onAssigneeChange={handleAssigneeChange}
                workspaceId={fullIssue.project?.workspace_id || ''}
              />

              {/* Labels */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Labels</h3>
                  <button
                    onClick={() => setIsLabelSelectorOpen(!isLabelSelectorOpen)}
                    className="p-1 hover:bg-muted rounded-md"
                  >
                    <Tag className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => handleLabelToggle(label.id)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${selectedLabels.includes(label.id)
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-muted text-gray-300'
                        }`}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Related Issues */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Related Issues</h3>
                  <button className="p-1 hover:bg-muted rounded-md">
                    <Link2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="space-y-2">
                  {fullIssue.source_relationships?.map(relation => (
                    <RelatedIssueCard
                      key={relation.target_issue.id}
                      title={relation.target_issue.title}
                      status={relation.target_issue.status}
                      priority={relation.target_issue.priority}
                      description={relation.target_issue.description || ''}
                    />
                  ))}
                  {fullIssue.target_relationships?.map(relation => (
                    <RelatedIssueCard
                      key={relation.source_issue.id}
                      title={relation.source_issue.title}
                      status={relation.source_issue.status}
                      priority={relation.source_issue.priority}
                      description={relation.source_issue.description || ''}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};