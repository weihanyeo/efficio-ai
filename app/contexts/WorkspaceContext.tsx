'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import type { Workspace } from '../types';
import {
  useWorkspaceMemberIds,
  useWorkspaces,
  useWorkspaceMembers,
  useCreateWorkspace,
  useInviteMember
} from '../hooks/useWorkspaceQueries';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  error: Error | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string, type: 'personal' | 'team') => Promise<void>;
  inviteMember: (workspaceId: string, email: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const { user, loading: authLoading } = useAuth();

  // Query workspace member IDs
  const { 
    data: memberWorkspaceIds = [], 
    loading: memberIdsLoading,
    error: memberIdsError,
    refetch: refetchMemberIds 
  } = useWorkspaceMemberIds(user?.id);

  // Query workspaces
  const {
    data: workspaces = [],
    loading: workspacesLoading,
    error: workspacesError,
    refetch: refetchWorkspaces
  } = useWorkspaces(
    user?.id,
    memberWorkspaceIds.map(m => m.workspace_id)
  );

  // Debug logs
  useEffect(() => {
    console.log('WorkspaceProvider state:', {
      user: user?.id,
      authLoading,
      memberWorkspaceIds: memberWorkspaceIds.length,
      memberIdsLoading,
      memberIdsError,
      workspaces: workspaces.length,
      workspacesLoading,
      workspacesError,
      currentWorkspace: currentWorkspace?.id
    });
  }, [user, authLoading, memberWorkspaceIds, memberIdsLoading, workspaces, workspacesLoading, currentWorkspace]);

  // Try to restore current workspace from localStorage
  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
    console.log('Trying to restore workspace:', { savedWorkspaceId, workspaces });
    
    if (savedWorkspaceId && workspaces.length > 0 && !workspacesLoading) {
      const savedWorkspace = workspaces.find(w => w.id === savedWorkspaceId);
      if (savedWorkspace) {
        console.log('Restored workspace:', savedWorkspace.id);
        setCurrentWorkspace(savedWorkspace);
        return;
      }
    }

    // If no saved workspace or it doesn't exist anymore, set the first available workspace
    if (!currentWorkspace && workspaces.length > 0 && !workspacesLoading) {
      console.log('Setting default workspace:', workspaces[0].id);
      setCurrentWorkspace(workspaces[0]);
    }
  }, [workspaces, workspacesLoading]);

  // Query members for the current workspace
  const {
    data: currentMembers = [],
    loading: membersLoading,
    error: membersError
  } = useWorkspaceMembers(currentWorkspace?.id);

  // Mutations
  const { createWorkspace: create } = useCreateWorkspace();
  const { inviteMember: invite } = useInviteMember();

  // Save current workspace ID
  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem('currentWorkspaceId', currentWorkspace.id);
    }
  }, [currentWorkspace]);

  // Combine workspace with its members
  const workspacesWithMembers = workspaces.map(workspace => ({
    ...workspace,
    workspace_members: workspace.id === currentWorkspace?.id ? currentMembers : []
  }));

  // Combine loading states
  const loading = memberIdsLoading || workspacesLoading || membersLoading || authLoading;
  const error = memberIdsError || workspacesError || membersError;

  // Create workspace wrapper
  const createWorkspace = async (name: string, type: 'personal' | 'team') => {
    if (!user) throw new Error('User not authenticated');
    await create(user.id, name, type);
    await refetchWorkspaces();
    await refetchMemberIds();
  };

  // Invite member wrapper
  const inviteMember = async (workspaceId: string, email: string) => {
    await invite(workspaceId, email);
    await refetchWorkspaces();
  };

  // Refresh workspaces
  const refreshWorkspaces = async () => {
    if (!user?.id) return;
    
    try {
      await refetchMemberIds();
      await refetchWorkspaces();
      
      // If current workspace was deleted, select the first available one
      if (workspaces.length > 0 && currentWorkspace) {
        const currentExists = workspaces.some(w => w.id === currentWorkspace?.id);
        if (!currentExists) {
          setCurrentWorkspace(workspaces[0]);
        }
      }
    } catch (error) {
      console.error('Error refreshing workspaces:', error);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces: workspacesWithMembers,
        loading,
        error,
        setCurrentWorkspace,
        createWorkspace,
        inviteMember,
        refreshWorkspaces
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};