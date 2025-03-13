import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Issue } from '../types';

export const useIssues = () => {
  const updateIssue = useCallback(async (issue: Issue) => {
    const { data, error } = await supabase
      .from('issues')
      .update({
        title: issue.title,
        description: issue.description,
        assignee_id: issue.assignee_id,
        status: issue.status,
        points: issue.points,
        priority: issue.priority,
        updated_at: new Date().toISOString(),
      })
      .eq('id', issue.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating issue:', error);
      throw error;
    }

    return data;
  }, []);

  return {
    updateIssue,
  };
};
