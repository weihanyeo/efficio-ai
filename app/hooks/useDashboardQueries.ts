import { useSupabaseQuery } from './useSupabaseQuery';
import { supabase } from '../lib/supabase';
import type { ActivityFeed, WorkspaceStats } from '../types';

export function useActivityFeed(workspaceId: string | undefined) {
  return useSupabaseQuery<ActivityFeed>(
    () => supabase
      .from('activity_feed')
      .select(`
        *,
        actor:profiles!activity_feed_actor_id_fkey (*),
        project:projects!activity_feed_project_id_fkey (*)
      `)
      .eq('workspace_id', workspaceId || '')
      .order('created_at', { ascending: false })
      .limit(3),
    {
      enabled: !!workspaceId,
      pollInterval: 10000
    }
  );
}

export function useWorkspaceStats(workspaceId: string | undefined) {
  return useSupabaseQuery<WorkspaceStats>(
    () => supabase
      .rpc('get_workspace_stats', { workspace_id: workspaceId || '' })
      .single(),
    {
      enabled: !!workspaceId,
      transform: (data) => {
        console.log('Raw workspace stats:', data);
        
        if (!data) {
          console.log('No workspace stats data, returning defaults');
          return {
            total_projects: 0,
            active_projects: 0,
            total_issues: 0,
            completed_issues: 0,
            open_issues: 0,
            ai_summary: '',
            velocity: {
              current: 0,
              previous: 0,
              trend: 'up' as const
            },
            completed_tasks_trend: 'up' as const,
            open_prs_trend: 'up' as const,
            code_quality: {
              score: 0,
              trend: 'up' as const
            }
          };
        }

        return {
          total_projects: data.total_projects || 0,
          active_projects: data.active_projects || 0,
          total_issues: data.total_issues || 0,
          completed_issues: data.completed_issues || 0,
          open_issues: data.open_issues || 0,
          ai_summary: data.ai_summary || '',
          velocity: {
            current: data.velocity?.current || 0,
            previous: data.velocity?.previous || 0,
            trend: data.velocity?.trend || 'up'
          },
          completed_tasks_trend: data.completed_tasks_trend || 'up',
          open_prs_trend: data.open_prs_trend || 'up',
          code_quality: {
            score: data.code_quality?.score || 0,
            trend: data.code_quality?.trend || 'up'
          }
        };
      }
    }
  );
}
