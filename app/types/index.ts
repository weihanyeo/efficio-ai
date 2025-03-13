export type ProjectStatus = 'Backlog' | 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';
export type IssueStatus = 'Backlog' | 'Todo' | 'InProgress' | 'Done' | 'Cancelled' | 'Duplicate';
export type Priority = 'NoPriority' | 'Urgent' | 'High' | 'Medium' | 'Low';
export type TeamFunction = 'Engineering' | 'Design' | 'Product' | 'Management' | 'Other';
export type TeamRole = 'owner' | 'Member';
export type Permission = TeamRole | 'Viewer';
export type SuggestionType = 'task' | 'optimization' | 'insight' | 'automation';
export type ActivityType = 'commit' | 'pr' | 'doc' | 'issue' | 'comment' | 'status_change';
export type ImpactLevel = 'high' | 'medium' | 'low';
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface InviteCodeParams {
  workspace_id: string;
  role: TeamRole;
  function: TeamFunction;
  expiry_days?: number;
  email?: string;
}

export interface InviteCodeResponse {
  code: string;
  token: string;
  inviteUrl: string;
  expires_at: string;
}

export interface CreateInviteParams {
  workspace_id: string;
  role: TeamRole;
  function: TeamFunction;
  expiry_days?: number;
  email?: string;
}

export interface CreateInviteResponse {
  token: string;
  inviteUrl: string;
  expires_at: string;
}

export interface ActivityMetadata {
  issue_id?: string;
  priority?: Priority;
  points?: number;
  old_status?: IssueStatus;
  new_status?: IssueStatus;
  status?: string;
  comment_id?: string;
  old_assignee_id?: string;
  new_assignee_id?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: ProjectStatus;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  project_id: string;
  identifier: string;
  title: string;
  description?: string;
  assignee_id?: string;
  status: IssueStatus;
  priority: Priority;
  points?: number;
  start_date?: string;
  end_date?: string;
  ai_summary?: string;
  parent_issue_id?: string;
  estimated_hours?: number;
  actual_hours?: number;
  is_epic: boolean;
  created_at: string;
  updated_at: string;
  metadata?: IssueMetadata[];
  assignee?: Profile;
  parent?: Issue;
  children?: Issue[];
  comments?: Comment[];
  labels?: IssueLabel[];
  related_issues?: Issue[];
  blocking_issues?: Issue[];
}

export interface DatabaseIssue extends Omit<Issue, 'labels' | 'comments' | 'related_issues' | 'blocking_issues'> {
  assignee?: Profile;
  comments?: (Comment & { author?: Profile })[];
  labels?: { label: IssueLabel }[];
  related_issues?: { target: Issue }[];
  blocking_issues?: { source: Issue }[];
  project?: { workspace_id: string };
}

export interface Notification {
  id: string;
  workspace_id: string;
  recipient_id: string;
  type: 'commit' | 'pr' | 'mention' | 'review' | 'ai';
  title: string;
  description: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface AISuggestion {
  id: string;
  workspace_id: string;
  type: SuggestionType;
  title: string;
  description: string;
  action: string;
  priority: number;
  is_implemented: boolean;
  created_at: string;
  updated_at: string;
}

export interface AISuggestionContext {
  suggestion_id: string;
  context_type: 'issue' | 'project' | 'workspace';
  context_id: string;
  created_at: string;
}

export interface ActivityFeed {
  id: string;
  workspace_id: string;
  project_id: string;
  actor_id: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata: ActivityMetadata;
  impact: ImpactLevel;
  status?: string;
  created_at: string;
  actor?: Profile;
  project?: Project;
}

export interface WorkspaceInvite {
  id: string;
  workspace_id: string;
  inviter_id: string;
  email: string;
  role: TeamRole;
  function: TeamFunction;
  status: InviteStatus;
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  workspace?: Workspace;
  inviter?: Profile;
}

export interface WorkspaceMember {
  workspace_id: string;
  member_id: string;
  role: TeamRole;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  author?: Profile;
  replies?: Comment[];
}

export interface IssueLabel {
  id: string;
  name: string;
  created_at: string;
}

export interface IssueLabelAssignment {
  issue_id: string;
  label_id: string;
}

export interface IssueRelationship {
  source_issue_id: string;
  target_issue_id: string;
  relationship_type: 'blocks' | 'relates_to' | 'duplicates';
}

export interface WorkspaceStats {
  total_projects: number;
  active_projects: number;
  total_issues: number;
  completed_issues: number;
  open_issues: number;
  ai_summary?: string;
  velocity: {
    current: number;
    previous: number;
    trend: 'up' | 'down';
  };
  completed_tasks_trend: 'up' | 'down';
  open_prs_trend: 'up' | 'down';
  code_quality: {
    score: number;
    trend: 'up' | 'down';
  };
}

export interface IssueMetadata {
  issue_id: string;
  key: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}

export interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
}