'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useIssues } from '../hooks/useIssues';
import { Search, Filter, Calendar, MessageSquare, GitBranch, ChevronDown, ChevronUp, Bot, Send, Users, User, Plus, HelpCircle, Edit } from 'lucide-react';
import { Database } from '../types/database.types';
import { IssueDetail } from './IssueDetail';
import { Issue, IssueStatus, WorkspaceMember } from '../types';
import { supabase } from '../lib/supabase';

type DragState = {
  isDragging: boolean;
  draggedIssue: Issue | null;
  dropTarget: string | null;
};

type IssueSectionProps = {
  title: string;
  issues: Issue[];
  onSelect: (issue: Issue) => void;
  onDragStart: (issue: Issue, e: React.DragEvent) => void;
  onDrop: (status: string, e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  status: string;
  isDragTarget: boolean;
  className?: string;
};

const IssueSection: React.FC<IssueSectionProps> = ({
  title,
  issues,
  onSelect,
  onDragStart,
  onDrop,
  onDragOver,
  status,
  isDragTarget,
  className
}) => {
  return (
    <div
      className={`${className} ${isDragTarget ? 'ring-2 ring-indigo-500' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.setAttribute('data-status', status);
        onDragOver(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        console.log('Dropping in section:', status);
        onDrop(status, e);
      }}
      data-status={status}
    >
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="space-y-2">
        {issues.map(issue => (
          <IssueRow
            key={issue.id}
            issue={issue}
            onSelect={onSelect}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
};

interface IssueRowProps {
  issue: Issue;
  onSelect: (issue: Issue) => void;
  onDragStart: (issue: Issue, e: React.DragEvent) => void;
}

const IssueRow: React.FC<IssueRowProps> = ({ issue, onSelect, onDragStart }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(issue.title);
  const [editedDescription, setEditedDescription] = useState(issue.description || '');
  const { updateIssue } = useIssues();
  const { workspaceMembers } = useWorkspace();

  const handleEditSave = async () => {
    await updateIssue({
      ...issue,
      title: editedTitle,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  const handleAssigneeChange = async (memberId: string) => {
    await updateIssue({
      ...issue,
      assignee_id: memberId || null,
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', dateStr, e);
      return dateStr;
    }
  };

  return (
    <div
      className="group p-3 bg-[#161616] border border-[#262626] rounded-lg hover:border-[#363636] transition-colors cursor-pointer"
      onClick={() => !isEditing && onSelect(issue)}
      onDoubleClick={() => setIsEditing(true)}
      draggable
      onDragStart={(e) => onDragStart(issue, e)}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-[#262626] text-white px-2 py-1 rounded"
              />
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full bg-[#262626] text-white px-2 py-1 rounded"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEditSave}
                  className="px-2 py-1 bg-indigo-600 text-white rounded text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 bg-gray-600 text-white rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-white truncate">{issue.title}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
              {issue.description && (
                <p className="text-xs text-gray-400 line-clamp-2">{issue.description}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <AssigneeSelector
            currentAssignee={issue.assignee_id}
            workspaceMembers={workspaceMembers || []}
            onAssigneeChange={handleAssigneeChange}
          />
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MessageSquare className="w-3 h-3" />
            <span>{issue.comments?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <GitBranch className="w-3 h-3" />
            <span>{issue.related_issues?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AssigneeSelectorProps {
  currentAssignee: string | null;
  workspaceMembers: WorkspaceMember[];
  onAssigneeChange: (memberId: string) => void;
}

const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  currentAssignee,
  workspaceMembers,
  onAssigneeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentMember = workspaceMembers.find(m => m.member_id === currentAssignee);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#262626] transition-colors"
      >
        {currentMember ? (
          <>
            <img
              src={currentMember.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentMember.email}`}
              alt={currentMember.email}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm">{currentMember.email}</span>
          </>
        ) : (
          <>
            <User className="w-4 h-4" />
            <span className="text-sm text-gray-400">Unassigned</span>
          </>
        )}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-48 bg-[#161616] border border-[#363636] rounded-lg shadow-lg z-10">
          <div className="p-2">
            <div 
              className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-[#262626]"
              onClick={() => {
                onAssigneeChange('');
                setIsOpen(false);
              }}
            >
              <User className="w-4 h-4" />
              <span className="text-sm text-gray-400">Unassigned</span>
            </div>
            {workspaceMembers.map((member) => (
              <div
                key={member.member_id}
                className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-[#262626]"
                onClick={() => {
                  onAssigneeChange(member.member_id);
                  setIsOpen(false);
                }}
              >
                <img
                  src={member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.email}`}
                  alt={member.email}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm">{member.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const MainContent = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedIssue: null,
    dropTarget: null
  });
  const [scope, setScope] = useState<'all' | 'me'>('all');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [quickCreateStatus, setQuickCreateStatus] = useState<Database['public']['Enums']['issue_status']>('Todo');

  const loadIssues = async () => {
    if (!currentWorkspace) {
      console.log('No workspace selected');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Loading issues for workspace:', currentWorkspace.id);
      // Get all issues for the current workspace's projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('workspace_id', currentWorkspace.id);

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        throw projectsError;
      }

      // If there are projects, get their issues
      if (projects && projects.length > 0) {
        const projectIds = projects.map(p => p.id);
        
        const { data: issuesData, error: issuesError } = await supabase
          .from('issues')
          .select(`
            *,
            assignee:profiles(*),
            comments(*),
            labels:issue_label_assignments(
              label:issue_labels(*)
            )
          `)
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });

        if (issuesError) {
          console.error('Error loading issues:', issuesError);
          throw issuesError;
        }

        setIssues(issuesData || []);
      } else {
        console.log('No projects found, creating default project');
        let project = null;
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            workspace_id: currentWorkspace.id,
            title: 'Default Project',
            description: 'Default project for tasks'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating default project:', createError);
          throw createError;
        }

        project = newProject;
        setIssues([]);
      }
    } catch (error) {
      console.error('Failed to load issues:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadIssues();
    }
  }, [currentWorkspace]);

  const handleCreateIssue = async (issue: Partial<Issue>) => {
    if (!currentWorkspace) {
      console.error('No workspace selected');
      return;
    }

    try {
      // First try to get an existing project
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('workspace_id', currentWorkspace.id)
        .limit(1)
        .single();

      // If no project exists, create one
      let project = existingProject;
      if (!project) {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            title: 'Default Project',
            workspace_id: currentWorkspace.id,
            description: 'Default project for workspace',
            status: 'InProgress' as Database['public']['Enums']['project_status'],
            priority: 'Medium' as Database['public']['Enums']['priority_level']
          })
          .select()
          .single();

        if (projectError) throw projectError;
        project = newProject;
      }
      if (!project) throw new Error('Failed to get or create project');

      // Get the highest issue number for this project
      const { data: lastIssue } = await supabase
        .from('issues')
        .select('identifier')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Generate the next issue number
      const lastNumber = lastIssue 
        ? parseInt(lastIssue.identifier.split('-')[1], 10) : 0;
      const nextNumber = lastNumber + 1;
      const identifier = `PRJ-${nextNumber}`;

      const { data: newIssue, error } = await supabase
        .from('issues')
        .insert({
          title: issue.title,
          description: issue.description,
          status: issue.status || 'Todo',
          priority: issue.priority || 'Medium',
          project_id: project.id,
          points: issue.points || 1,
          assignee_id: issue.assignee_id,
          identifier
        })
        .select()
        .single();

      if (error) throw error;
      if (newIssue) {
        setIssues(prev => [newIssue, ...prev]);
      }
    } catch (error) {
      console.error('Error creating issue:', error);
    }
  };

  const handleUpdateIssueStatus = async (issueId: string, status: Database['public']['Enums']['issue_status']) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status })
        .eq('id', issueId);

      if (error) throw error;

      setIssues(prev => prev.map(issue => 
        issue.id === issueId ? { ...issue, status } : issue
      ));
    } catch (error) {
      console.error('Error updating issue status:', error);
    }
  };

  const handleUpdateIssuePriority = async (issueId: string, priority: Database['public']['Enums']['priority_level']) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ priority })
        .eq('id', issueId);

      if (error) throw error;

      setIssues(prev => prev.map(issue => 
        issue.id === issueId ? { ...issue, priority } : issue
      ));
    } catch (error) {
      console.error('Error updating issue priority:', error);
    }
  };

  const handleUpdateIssuePoints = async (issueId: string, points: number) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ points })
        .eq('id', issueId);

      if (error) throw error;

      setIssues(prev => prev.map(issue => 
        issue.id === issueId ? { ...issue, points } : issue
      ));
    } catch (error) {
      console.error('Error updating issue points:', error);
    }
  };

  const handleUpdateIssueAssignee = async (issueId: string, assigneeId: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ assignee_id: assigneeId })
        .eq('id', issueId);

      if (error) throw error;

      setIssues(prev => prev.map(issue => 
        issue.id === issueId ? { ...issue, assignee_id: assigneeId } : issue
      ));
    } catch (error) {
      console.error('Error updating issue assignee:', error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredIssues = issues.filter(issue => {
    if (scope === 'me' && issue.assignee_id !== user?.id) {
      return false;
    }
    
    if (filterStatus.length > 0 && !filterStatus.includes(issue.status)) {
      return false;
    }
    
    if (searchQuery) {
      return issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (issue.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    }
    return true;
  });

  console.log('Filtered issues:', filteredIssues);

  const groupedIssues = {
    Backlog: filteredIssues.filter(issue => issue.status === 'Backlog'),
    Todo: filteredIssues.filter(issue => issue.status === 'Todo'),
    InProgress: filteredIssues.filter(issue => issue.status === 'InProgress'),
    InReview: filteredIssues.filter(issue => issue.status === 'InReview'),
    Done: filteredIssues.filter(issue => issue.status === 'Done'),
    Cancelled: filteredIssues.filter(issue => issue.status === 'Cancelled'),
    Duplicate: filteredIssues.filter(issue => issue.status === 'Duplicate')
  };

  console.log('Grouped issues:', groupedIssues);

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading issues...</div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-400">Error: {error.message}</div>
      </div>
    );
  }

  console.log('Rendering main content');

  const handleDragStart = (issue: Issue, e: React.DragEvent) => {
    console.log('Drag start:', issue);
    e.dataTransfer.setData('issueId', issue.id);
    setDragState({
      isDragging: true,
      draggedIssue: issue,
      dropTarget: null
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const target = (e.currentTarget as HTMLElement).getAttribute('data-status');
    console.log('Drag over target:', target);
    if (target) {
      setDragState(prev => ({ ...prev, dropTarget: target }));
    }
  };

  const handleDrop = async (status: string, e: React.DragEvent) => {
    e.preventDefault();
    console.log('Drop target status:', status);
    const issueId = e.dataTransfer.getData('issueId');
    console.log('Dropped issue ID:', issueId);
    if (!issueId) return;

    try {
      console.log('Updating issue status to:', status);
      await handleUpdateIssueStatus(issueId, status as Database['public']['Enums']['issue_status']);
      setDragState({ isDragging: false, draggedIssue: null, dropTarget: null });
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating issue status:', error);
    }
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedIssue: null,
      dropTarget: null
    });
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              className="pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Issues</h2>
            <div className="flex rounded-md overflow-hidden border border-[#363636]">
              <button
                onClick={() => setScope('team')}
                className={`px-3 py-1.5 text-sm flex items-center gap-2 ${
                  scope === 'team' ? 'bg-[#363636] text-white' : 'text-gray-400 hover:bg-[#262626]'
                }`}
              >
                <Users className="w-4 h-4" /> Team
              </button>
              <button
                onClick={() => setScope('me')}
                className={`px-3 py-1.5 text-sm flex items-center gap-2 ${
                  scope === 'me' ? 'bg-[#363636] text-white' : 'text-gray-400 hover:bg-[#262626]'
                }`}
              >
                <User className="w-4 h-4" /> My Tasks
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-1.5 hover:bg-[#262626] rounded-md">
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-8 min-h-[200px]">
          {/* Backlog Section */}
          {groupedIssues.Backlog && groupedIssues.Backlog.length > 0 && (
            <IssueSection
              title="Backlog"
              issues={groupedIssues.Backlog}
              onSelect={setSelectedIssue}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              status="Backlog"
              isDragTarget={dragState.dropTarget === 'Backlog'}
              className="bg-[#1E1E1E] p-4 rounded-lg"
            />
          )}

          {/* Todo Section */}
          {groupedIssues.Todo && groupedIssues.Todo.length > 0 && (
            <IssueSection
              title="To Do"
              issues={groupedIssues.Todo}
              onSelect={setSelectedIssue}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              status="Todo"
              isDragTarget={dragState.dropTarget === 'Todo'}
              className="bg-[#1E1E1E] p-4 rounded-lg"
            />
          )}

          {/* In Progress Section */}
          {groupedIssues.InProgress && groupedIssues.InProgress.length > 0 && (
            <IssueSection
              title="In Progress"
              issues={groupedIssues.InProgress}
              onSelect={setSelectedIssue}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              status="InProgress"
              isDragTarget={dragState.dropTarget === 'InProgress'}
              className="bg-[#1E1E1E] p-4 rounded-lg"
            />
          )}

          {/* In Review Section */}
          {groupedIssues.InReview && groupedIssues.InReview.length > 0 && (
            <IssueSection
              title="In Review"
              issues={groupedIssues.InReview}
              onSelect={setSelectedIssue}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              status="InReview"
              isDragTarget={dragState.dropTarget === 'InReview'}
              className="bg-[#1E1E1E] p-4 rounded-lg"
            />
          )}

          {/* Done Section */}
          {groupedIssues.Done && groupedIssues.Done.length > 0 && (
            <IssueSection
              title="Done"
              issues={groupedIssues.Done}
              onSelect={setSelectedIssue}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              status="Done"
              isDragTarget={dragState.dropTarget === 'Done'}
              className="bg-[#1E1E1E] p-4 rounded-lg"
            />
          )}

          {/* Cancelled Section */}
          {groupedIssues.Cancelled && groupedIssues.Cancelled.length > 0 && (
            <IssueSection
              title="Cancelled"
              issues={groupedIssues.Cancelled}
              onSelect={setSelectedIssue}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              status="Cancelled"
              isDragTarget={dragState.dropTarget === 'Cancelled'}
              className="bg-[#1E1E1E] p-4 rounded-lg"
            />
          )}

          {/* Duplicate Section */}
          {groupedIssues.Duplicate && groupedIssues.Duplicate.length > 0 && (
            <IssueSection
              title="Duplicate"
              issues={groupedIssues.Duplicate}
              onSelect={setSelectedIssue}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              status="Duplicate"
              isDragTarget={dragState.dropTarget === 'Duplicate'}
              className="bg-[#1E1E1E] p-4 rounded-lg"
            />
          )}
          
          {/* Virtual Drop Zone */}
          {dragState.isDragging && (
            <div
              className="border-2 border-dashed border-indigo-500/50 rounded-lg p-4 flex items-center justify-center"
              onDragOver={(e) => {
                e.preventDefault();
                setDragState(prev => ({ ...prev, dropTarget: 'virtual' }));
              }}
              onDrop={(e) => {
                e.preventDefault();
                setShowStatusModal(true);
              }}
            >
              <div className="flex flex-col items-center gap-2 text-indigo-400">
                <Plus className="w-6 h-6" />
                <span className="text-sm">Drop to move to another status</span>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Status Selection Modal */}
      {showStatusModal && dragState.draggedIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#161616] rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Move Issue</h3>
            <div className="space-y-2">
              {['Backlog', 'Todo', 'InProgress', 'Done', 'Cancelled', 'Duplicate'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    handleDrop(status, new DragEvent('drop', {
                      dataTransfer: new DataTransfer()
                    }));
                    setShowStatusModal(false);
                  }}
                  className="w-full p-3 text-left rounded-md hover:bg-[#262626] transition-colors"
                >
                  {status}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="mt-4 w-full p-2 bg-[#262626] rounded-md hover:bg-[#363636]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {selectedIssue && (
        <IssueDetail
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
      
      {/* Quick Create Issue Bar */}
      <div className="fixed bottom-0 left-60 right-80 p-4 bg-[#161616] border-t border-[#262626]">
        <div className="flex gap-3">
          <select
            value={quickCreateStatus}
            onChange={(e) => setQuickCreateStatus(e.target.value as Database['public']['Enums']['issue_status'])}
            className="px-3 py-2 bg-[#262626] border border-[#363636] rounded-md text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="Backlog">Backlog</option>
            <option value="Todo">To Do</option>
            <option value="InProgress">In Progress</option>
            <option value="Done">Done</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Duplicate">Duplicate</option>
          </select>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Describe your task... AI will analyze the context and suggest related items"
              className="w-full pl-4 pr-10 py-2 bg-[#262626] border border-[#363636] rounded-md text-sm focus:outline-none focus:border-indigo-500"
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const title = e.currentTarget.value.trim();
                  await handleCreateIssue({
                    title,
                    status: quickCreateStatus,
                    priority: 'Medium',
                    points: 1,
                  });
                  e.currentTarget.value = '';
                }
              }}
            />
            <Bot className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400 flex items-center gap-2">
          <Bot className="w-3 h-3" />
          AI will analyze your description to determine priority, points, and suggest related tasks
        </p>
      </div>
    </div>
  );
};