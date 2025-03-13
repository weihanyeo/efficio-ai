import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';
import type { Workspace } from '../types';
import type { Database } from '../types/database.types';

export function useWorkspaceMemberIds(userId: string | undefined) {
  return useSupabaseQuery<{ workspace_id: string }>(
    () => supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('member_id', userId || ''),
    {
      enabled: !!userId
    }
  );
}

export function useWorkspaces(userId: string | undefined, memberWorkspaceIds: string[]) {
  return useSupabaseQuery<Workspace>(
    () => {
      if (!userId) {
        console.log('useWorkspaces: No userId provided');
        return supabase.from('workspaces').select('*').limit(0);
      }

      console.log('useWorkspaces query params:', { userId, memberWorkspaceIds });

      const query = supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members!workspace_members_workspace_id_fkey (
            member_id,
            role
          )
        `);

      // Get workspaces where user is either owner or member
      return query.or(`owner_id.eq.${userId},id.in.(${memberWorkspaceIds.join(',')})`);
    },
    {
      enabled: !!userId,
      pollInterval: 10000,
      transform: (data) => {
        if (!data) {
          console.log('useWorkspaces: No data returned');
          return [];
        }
        console.log('useWorkspaces raw data:', data);
        return data.map((workspace: Database['public']['Tables']['workspaces']['Row']) => ({
          ...workspace,
          created_at: workspace.created_at || new Date().toISOString(),
          updated_at: workspace.updated_at || new Date().toISOString()
        }));
      }
    }
  );
}

export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useSupabaseQuery<{ member_id: string; role: string }>(
    () => supabase
      .from('workspace_members')
      .select(`
        member_id,
        role,
        profiles!workspace_members_member_id_fkey (
          email,
          full_name
        )
      `)
      .eq('workspace_id', workspaceId || ''),
    {
      enabled: !!workspaceId
    }
  );
}

export function useCreateWorkspace() {
  const createWorkspace = useCallback(async (
    userId: string,
    name: string,
    type: 'personal' | 'team'
  ) => {
    try {
      const { data: workspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          name,
          type,
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add the creator as a member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          member_id: userId,
          role: 'owner'
        });

      if (memberError) throw memberError;

      return workspace;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to create workspace');
    }
  }, []);

  return { createWorkspace };
}

export function useInviteMember() {
  const inviteMember = useCallback(async (workspaceId: string, email: string) => {
    try {
      // First get the user ID from the email
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) throw userError;
      if (!users) throw new Error('User not found');

      // Then add them as a member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          member_id: users.id,
          role: 'member'
        });

      if (memberError) throw memberError;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to invite member');
    }
  }, []);

  return { inviteMember };
}
