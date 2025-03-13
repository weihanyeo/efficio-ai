import { supabase } from './supabase';
import type { 
  Project, 
  Issue, 
  Comment,
  IssueLabel,
  ProjectStatus,
  IssueStatus,
  Priority 
} from '../types';

// Projects API
export const projectsApi = {
  async list(workspaceId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        issues (
          *,
          assignee:profiles (id, full_name, email),
          labels:issue_label_assignments (
            label:issue_labels (*)
          )
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async get(projectId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        issues (
          *,
          assignee:profiles (id, full_name, email),
          labels:issue_label_assignments (
            label:issue_labels (*)
          )
        )
      `)
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data;
  },

  async create(project: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(projectId: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(projectId: string, status: ProjectStatus) {
    return this.update(projectId, { projectStatus: status });
  }
};

// Issues API
export const issuesApi = {
  async list(projectId: string) {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        assignee:profiles (id, full_name, email),
        labels:issue_label_assignments (
          label:issue_labels (*)
        ),
        comments (
          *,
          author:profiles (id, full_name, email)
        ),
        related_issues:issue_relationships!source_issue_id_fkey (
          target:issues!target_issue_id_fkey (*),
          relationship_type
        ),
        blocking_issues:issue_relationships!target_issue_id_fkey (
          source:issues!source_issue_id_fkey (*),
          relationship_type
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async get(issueId: string) {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        assignee:profiles (id, full_name, email),
        labels:issue_label_assignments (
          label:issue_labels (*)
        ),
        comments (
          *,
          author:profiles (id, full_name, email)
        ),
        related_issues:issue_relationships!source_issue_id_fkey (
          target:issues!target_issue_id_fkey (*),
          relationship_type
        ),
        blocking_issues:issue_relationships!target_issue_id_fkey (
          source:issues!source_issue_id_fkey (*),
          relationship_type
        )
      `)
      .eq('id', issueId)
      .single();

    if (error) throw error;
    return data;
  },

  async create(issue: Partial<Issue>) {
    const { data, error } = await supabase
      .from('issues')
      .insert(issue)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(issueId: string, updates: Partial<Issue>) {
    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', issueId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(issueId: string, status: IssueStatus) {
    return this.update(issueId, { issueStatus: status });
  },

  async updatePriority(issueId: string, priority: Priority) {
    return this.update(issueId, { priority });
  },

  async updateAssignee(issueId: string, assigneeId: string) {
    return this.update(issueId, { assignee_id: assigneeId });
  }
};

// Comments API
export const commentsApi = {
  async create(comment: Partial<Comment>) {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select(`
        *,
        author:profiles (id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async update(commentId: string, content: string) {
    const { data, error } = await supabase
      .from('comments')
      .update({ content, is_edited: true })
      .eq('id', commentId)
      .select(`
        *,
        author:profiles (id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async delete(commentId: string) {
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId);

    if (error) throw error;
  }
};

// Labels API
export const labelsApi = {
  async list() {
    const { data, error } = await supabase
      .from('issue_labels')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  async create(label: Partial<IssueLabel>) {
    const { data, error } = await supabase
      .from('issue_labels')
      .insert(label)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async assignToIssue(issueId: string, labelId: string) {
    const { error } = await supabase
      .from('issue_label_assignments')
      .insert({ issue_id: issueId, label_id: labelId });

    if (error) throw error;
  },

  async removeFromIssue(issueId: string, labelId: string) {
    const { error } = await supabase
      .from('issue_label_assignments')
      .delete()
      .eq('issue_id', issueId)
      .eq('label_id', labelId);

    if (error) throw error;
  }
};

// Issue Relationships API
export const relationshipsApi = {
  async create(sourceId: string, targetId: string, type: string) {
    const { error } = await supabase
      .from('issue_relationships')
      .insert({
        source_issue_id: sourceId,
        target_issue_id: targetId,
        relationship_type: type
      });

    if (error) throw error;
  },

  async delete(sourceId: string, targetId: string, type: string) {
    const { error } = await supabase
      .from('issue_relationships')
      .delete()
      .eq('source_issue_id', sourceId)
      .eq('target_issue_id', targetId)
      .eq('relationship_type', type);

    if (error) throw error;
  }
};