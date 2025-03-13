

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."activity_type" AS ENUM (
    'commit',
    'pr',
    'doc',
    'issue',
    'comment',
    'status_change'
);


ALTER TYPE "public"."activity_type" OWNER TO "postgres";


CREATE TYPE "public"."impact_level" AS ENUM (
    'high',
    'medium',
    'low'
);


ALTER TYPE "public"."impact_level" OWNER TO "postgres";


CREATE TYPE "public"."invite_status" AS ENUM (
    'pending',
    'accepted',
    'expired',
    'revoked'
);


ALTER TYPE "public"."invite_status" OWNER TO "postgres";


CREATE TYPE "public"."issue_status" AS ENUM (
    'Backlog',
    'Todo',
    'InProgress',
    'Done',
    'Cancelled',
    'Duplicate'
);


ALTER TYPE "public"."issue_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'commit',
    'pr',
    'mention',
    'review',
    'ai'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."priority_level" AS ENUM (
    'NoPriority',
    'Urgent',
    'High',
    'Medium',
    'Low'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


CREATE TYPE "public"."project_status" AS ENUM (
    'Backlog',
    'Planned',
    'InProgress',
    'Completed',
    'Cancelled'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";


CREATE TYPE "public"."relationship_type" AS ENUM (
    'blocks',
    'relates_to',
    'duplicates'
);


ALTER TYPE "public"."relationship_type" OWNER TO "postgres";


CREATE TYPE "public"."suggestion_type" AS ENUM (
    'task',
    'optimization',
    'insight',
    'automation'
);


ALTER TYPE "public"."suggestion_type" OWNER TO "postgres";


CREATE TYPE "public"."teamfunction" AS ENUM (
    'Engineering',
    'Design',
    'Product',
    'Management',
    'Other'
);


ALTER TYPE "public"."teamfunction" OWNER TO "postgres";


CREATE TYPE "public"."teamrole" AS ENUM (
    'Owner',
    'Admin',
    'Member'
);


ALTER TYPE "public"."teamrole" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_workspace_access"("workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE id = workspace_id 
    AND owner_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."check_workspace_access"("workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_comment_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_feed (
      workspace_id,
      project_id,
      actor_id,
      type,
      title,
      description,
      metadata
    )
    SELECT
      p.workspace_id,
      i.project_id,
      auth.uid(),
      'comment'::activity_type,
      'New Comment Added',
      substring(NEW.content from 1 for 150),
      jsonb_build_object(
        'issue_id', NEW.issue_id,
        'comment_id', NEW.id
      )
    FROM public.issues i
    JOIN public.projects p ON p.id = i.project_id
    WHERE i.id = NEW.issue_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_comment_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_issue_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_feed (
      workspace_id,
      project_id,
      actor_id,
      type,
      title,
      description,
      metadata,
      status
    )
    SELECT
      p.workspace_id,
      NEW.project_id,
      auth.uid(),
      'issue'::activity_type,
      'New Issue Created',
      NEW.title,
      jsonb_build_object(
        'issue_id', NEW.id,
        'priority', NEW.priority,
        'points', NEW.points
      ),
      NEW.status::text
    FROM public.projects p
    WHERE p.id = NEW.project_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.activity_feed (
      workspace_id,
      project_id,
      actor_id,
      type,
      title,
      description,
      metadata,
      status
    )
    SELECT
      p.workspace_id,
      NEW.project_id,
      auth.uid(),
      'status_change'::activity_type,
      'Issue Status Changed',
      format('Changed from %s to %s', OLD.status, NEW.status),
      jsonb_build_object(
        'issue_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      NEW.status::text
    FROM public.projects p
    WHERE p.id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_issue_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_invites"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.workspace_invites
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."expire_invites"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invite_token"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  token text;
  done bool;
BEGIN
  done := false;
  WHILE NOT done LOOP
    token := encode(gen_random_bytes(24), 'base64');
    done := NOT EXISTS (SELECT 1 FROM workspace_invites WHERE workspace_invites.token = token);
  END LOOP;
  RETURN token;
END;
$$;


ALTER FUNCTION "public"."generate_invite_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_workspace_stats"("workspace_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    total_projects INT := 0;
    active_projects INT := 0;
    total_issues INT := 0;
    completed_issues INT := 0;
    open_issues INT := 0;
    current_velocity NUMERIC := 0;
    previous_velocity NUMERIC := 0;
    velocity_trend TEXT := 'up';
    completed_tasks_trend TEXT := 'up';
    open_prs_trend TEXT := 'up';
    code_quality_score INT := 85;
    code_quality_trend TEXT := 'up';
    ai_summary TEXT := '';
    result jsonb;
BEGIN
    -- Check if workspace exists
    IF NOT EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = get_workspace_stats.workspace_id
    ) THEN
        -- Return default values if workspace doesn't exist
        RETURN jsonb_build_object(
            'total_projects', total_projects,
            'active_projects', active_projects,
            'total_issues', total_issues,
            'completed_issues', completed_issues,
            'open_issues', open_issues,
            'ai_summary', ai_summary,
            'velocity', jsonb_build_object(
                'current', current_velocity,
                'previous', previous_velocity,
                'trend', velocity_trend
            ),
            'completed_tasks_trend', completed_tasks_trend,
            'open_prs_trend', open_prs_trend,
            'code_quality', jsonb_build_object(
                'score', code_quality_score,
                'trend', code_quality_trend
            )
        );
    END IF;

    -- Get project counts
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'InProgress')
    INTO 
        total_projects,
        active_projects
    FROM projects
    WHERE projects.workspace_id = get_workspace_stats.workspace_id;

    -- Get issue counts
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE i.status = 'Done'),
        COUNT(*) FILTER (WHERE i.status IN ('Backlog', 'Todo', 'InProgress'))
    INTO 
        total_issues,
        completed_issues,
        open_issues
    FROM issues i
    JOIN projects p ON i.project_id = p.id
    WHERE p.workspace_id = get_workspace_stats.workspace_id;

    -- Calculate velocity (points completed in last 2 weeks)
    SELECT 
        COALESCE(SUM(i.points), 0)
    INTO 
        current_velocity
    FROM issues i
    JOIN projects p ON i.project_id = p.id
    WHERE 
        p.workspace_id = get_workspace_stats.workspace_id
        AND i.status = 'Done'
        AND i.updated_at >= NOW() - INTERVAL '2 weeks';

    -- Calculate previous velocity (points completed in the 2 weeks before that)
    SELECT 
        COALESCE(SUM(i.points), 0)
    INTO 
        previous_velocity
    FROM issues i
    JOIN projects p ON i.project_id = p.id
    WHERE 
        p.workspace_id = get_workspace_stats.workspace_id
        AND i.status = 'Done'
        AND i.updated_at >= NOW() - INTERVAL '4 weeks'
        AND i.updated_at < NOW() - INTERVAL '2 weeks';

    -- Determine velocity trend
    IF current_velocity > previous_velocity THEN
        velocity_trend := 'up';
    ELSE
        velocity_trend := 'down';
    END IF;

    -- Determine completed tasks trend (simplified)
    SELECT 
        CASE 
            WHEN COUNT(*) FILTER (WHERE i.updated_at >= NOW() - INTERVAL '2 weeks') >
                 COUNT(*) FILTER (WHERE i.updated_at >= NOW() - INTERVAL '4 weeks' AND i.updated_at < NOW() - INTERVAL '2 weeks')
            THEN 'up'
            ELSE 'down'
        END
    INTO 
        completed_tasks_trend
    FROM issues i
    JOIN projects p ON i.project_id = p.id
    WHERE 
        p.workspace_id = get_workspace_stats.workspace_id
        AND i.status = 'Done'
        AND i.updated_at >= NOW() - INTERVAL '4 weeks';

    -- Determine open PRs trend (simplified - using open issues as proxy)
    SELECT 
        CASE 
            WHEN COUNT(*) FILTER (WHERE i.created_at >= NOW() - INTERVAL '2 weeks') <
                 COUNT(*) FILTER (WHERE i.created_at >= NOW() - INTERVAL '4 weeks' AND i.created_at < NOW() - INTERVAL '2 weeks')
            THEN 'down'
            ELSE 'up'
        END
    INTO 
        open_prs_trend
    FROM issues i
    JOIN projects p ON i.project_id = p.id
    WHERE 
        p.workspace_id = get_workspace_stats.workspace_id
        AND i.status IN ('Backlog', 'Todo', 'InProgress')
        AND i.created_at >= NOW() - INTERVAL '4 weeks';

    -- Set AI summary
    ai_summary := 'Your team has completed ' || completed_issues || ' issues out of ' || total_issues || 
                  ' total. Velocity is ' || current_velocity || ' points per sprint, which is ' || 
                  CASE WHEN velocity_trend = 'up' THEN 'improving' ELSE 'decreasing' END || 
                  ' compared to the previous period.';

    -- Construct and return the result JSON
    RETURN jsonb_build_object(
        'total_projects', total_projects,
        'active_projects', active_projects,
        'total_issues', total_issues,
        'completed_issues', completed_issues,
        'open_issues', open_issues,
        'ai_summary', ai_summary,
        'velocity', jsonb_build_object(
            'current', current_velocity,
            'previous', previous_velocity,
            'trend', velocity_trend
        ),
        'completed_tasks_trend', completed_tasks_trend,
        'open_prs_trend', open_prs_trend,
        'code_quality', jsonb_build_object(
            'score', code_quality_score,
            'trend', code_quality_trend
        )
    );
END;
$$;


ALTER FUNCTION "public"."get_workspace_stats"("workspace_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_workspace_stats"("workspace_id" "uuid") IS 'Returns statistics for a workspace, including project and issue counts, velocity, and trends';



CREATE OR REPLACE FUNCTION "public"."handle_issue_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  workspace_id uuid;
BEGIN
  -- Get workspace_id from project
  SELECT p.workspace_id INTO workspace_id
  FROM public.projects p
  WHERE p.id = NEW.project_id;

  -- Create activity for status change
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.activity_feed (
      workspace_id,
      project_id,
      actor_id,
      type,
      title,
      description,
      metadata,
      status
    ) VALUES (
      workspace_id,
      NEW.project_id,
      auth.uid(),
      'status_change',
      'Issue Status Changed',
      format('Changed from %s to %s', OLD.status, NEW.status),
      jsonb_build_object(
        'issue_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      NEW.status
    );
  END IF;

  -- Create activity for assignee change
  IF TG_OP = 'UPDATE' AND (
    (OLD.assignee_id IS NULL AND NEW.assignee_id IS NOT NULL) OR
    (OLD.assignee_id IS NOT NULL AND NEW.assignee_id IS NULL) OR
    (OLD.assignee_id != NEW.assignee_id)
  ) THEN
    INSERT INTO public.activity_feed (
      workspace_id,
      project_id,
      actor_id,
      type,
      title,
      description,
      metadata
    ) VALUES (
      workspace_id,
      NEW.project_id,
      auth.uid(),
      'issue',
      'Issue Assignee Changed',
      CASE
        WHEN OLD.assignee_id IS NULL THEN 'Issue assigned'
        WHEN NEW.assignee_id IS NULL THEN 'Issue unassigned'
        ELSE 'Issue reassigned'
      END,
      jsonb_build_object(
        'issue_id', NEW.id,
        'old_assignee_id', OLD.assignee_id,
        'new_assignee_id', NEW.assignee_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_issue_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_workspace_invite_direct"("p_workspace_id" "uuid", "p_inviter_id" "uuid", "p_email" "text", "p_role" "text", "p_function" "text", "p_token" "text", "p_status" "text", "p_expires_at" timestamp with time zone) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invite_id UUID;
BEGIN
  -- Direct insert without triggers, with type casting for enum types
  INSERT INTO workspace_invites (
    workspace_id,
    inviter_id,
    email,
    role,
    function,
    token,
    status,
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    p_workspace_id,
    p_inviter_id,
    p_email,
    p_role::teamrole,  -- Cast to teamrole enum
    p_function::teamfunction,  -- Cast to teamfunction enum
    p_token,
    p_status,
    p_expires_at,
    NOW(),
    NOW()
  ) RETURNING id INTO v_invite_id;
  
  RETURN v_invite_id;
END;
$$;


ALTER FUNCTION "public"."insert_workspace_invite_direct"("p_workspace_id" "uuid", "p_inviter_id" "uuid", "p_email" "text", "p_role" "text", "p_function" "text", "p_token" "text", "p_status" "text", "p_expires_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_workspace_invite_typed"("p_workspace_id" "uuid", "p_inviter_id" "uuid", "p_email" "text", "p_role" "public"."teamrole", "p_function" "public"."teamfunction", "p_token" "text", "p_status" "text", "p_expires_at" timestamp with time zone) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invite_id UUID;
BEGIN
  -- Direct insert without triggers
  INSERT INTO workspace_invites (
    workspace_id,
    inviter_id,
    email,
    role,
    function,
    token,
    status,
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    p_workspace_id,
    p_inviter_id,
    p_email,
    p_role,
    p_function,
    p_token,
    p_status,
    p_expires_at,
    NOW(),
    NOW()
  ) RETURNING id INTO v_invite_id;
  
  RETURN v_invite_id;
END;
$$;


ALTER FUNCTION "public"."insert_workspace_invite_typed"("p_workspace_id" "uuid", "p_inviter_id" "uuid", "p_email" "text", "p_role" "public"."teamrole", "p_function" "public"."teamfunction", "p_token" "text", "p_status" "text", "p_expires_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_invite_token"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.token IS NULL THEN
    NEW.token := generate_invite_token();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_invite_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_feed" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid",
    "project_id" "uuid",
    "actor_id" "uuid",
    "type" "public"."activity_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "impact" "public"."impact_level" DEFAULT 'medium'::"public"."impact_level",
    "branch" "text",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_feed" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_suggestion_contexts" (
    "suggestion_id" "uuid" NOT NULL,
    "context_type" "text" NOT NULL,
    "context_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_suggestion_contexts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid",
    "type" "public"."suggestion_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "action" "text" NOT NULL,
    "priority" integer DEFAULT 0,
    "is_implemented" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "issue_id" "uuid",
    "author_id" "uuid",
    "content" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_edited" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_agenda_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "uuid",
    "time" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "speaker" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_agenda_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_attendees" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "uuid",
    "user_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_attendees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_checklist_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "uuid",
    "task" "text" NOT NULL,
    "completed" boolean DEFAULT false,
    "assigned_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_organizers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "uuid",
    "user_id" "uuid",
    "role" "text" DEFAULT 'organizer'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_organizers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "start_time" "text" NOT NULL,
    "end_time" "text" NOT NULL,
    "date" "text" NOT NULL,
    "location" "text",
    "description" "text",
    "type" "text" NOT NULL,
    "color" "text",
    "user_id" "uuid",
    "workspace_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issue_label_assignments" (
    "issue_id" "uuid" NOT NULL,
    "label_id" "uuid" NOT NULL
);


ALTER TABLE "public"."issue_label_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issue_labels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."issue_labels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issue_metadata" (
    "issue_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."issue_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issue_relationships" (
    "source_issue_id" "uuid" NOT NULL,
    "target_issue_id" "uuid" NOT NULL,
    "relationship_type" "public"."relationship_type" NOT NULL
);


ALTER TABLE "public"."issue_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "identifier" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "assignee_id" "uuid",
    "status" "public"."issue_status" DEFAULT 'Todo'::"public"."issue_status" NOT NULL,
    "priority" "public"."priority_level" DEFAULT 'Medium'::"public"."priority_level" NOT NULL,
    "points" integer,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "ai_summary" "text",
    "parent_issue_id" "uuid",
    "estimated_hours" double precision,
    "actual_hours" double precision,
    "is_epic" boolean DEFAULT false
);


ALTER TABLE "public"."issues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid",
    "recipient_id" "uuid",
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "action_url" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "onboarding_completed" boolean DEFAULT false
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "status" "public"."project_status" DEFAULT 'Planned'::"public"."project_status" NOT NULL,
    "priority" "public"."priority_level" DEFAULT 'Medium'::"public"."priority_level" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."simple_workspace_invites" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "inviter_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "function" "text" NOT NULL,
    "token" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."simple_workspace_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid",
    "inviter_id" "uuid",
    "email" "text" NOT NULL,
    "role" "public"."teamrole" DEFAULT 'Member'::"public"."teamrole" NOT NULL,
    "function" "public"."teamfunction" NOT NULL,
    "status" "public"."invite_status" DEFAULT 'pending'::"public"."invite_status" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workspace_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_invites_temp" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "inviter_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "function" "text" NOT NULL,
    "token" "text" NOT NULL,
    "status" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workspace_invites_temp" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_members" (
    "workspace_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "workspaces_type_check" CHECK (("type" = ANY (ARRAY['personal'::"text", 'team'::"text"])))
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_feed"
    ADD CONSTRAINT "activity_feed_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_suggestion_contexts"
    ADD CONSTRAINT "ai_suggestion_contexts_pkey" PRIMARY KEY ("suggestion_id", "context_type", "context_id");



ALTER TABLE ONLY "public"."ai_suggestions"
    ADD CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_agenda_items"
    ADD CONSTRAINT "event_agenda_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_checklist_items"
    ADD CONSTRAINT "event_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_organizers"
    ADD CONSTRAINT "event_organizers_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_organizers"
    ADD CONSTRAINT "event_organizers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."issue_label_assignments"
    ADD CONSTRAINT "issue_label_assignments_pkey" PRIMARY KEY ("issue_id", "label_id");



ALTER TABLE ONLY "public"."issue_labels"
    ADD CONSTRAINT "issue_labels_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."issue_labels"
    ADD CONSTRAINT "issue_labels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."issue_metadata"
    ADD CONSTRAINT "issue_metadata_pkey" PRIMARY KEY ("issue_id", "key");



ALTER TABLE ONLY "public"."issue_relationships"
    ADD CONSTRAINT "issue_relationships_pkey" PRIMARY KEY ("source_issue_id", "target_issue_id", "relationship_type");



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_project_id_identifier_key" UNIQUE ("project_id", "identifier");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."simple_workspace_invites"
    ADD CONSTRAINT "simple_workspace_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."simple_workspace_invites"
    ADD CONSTRAINT "simple_workspace_invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."workspace_invites"
    ADD CONSTRAINT "workspace_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_invites_temp"
    ADD CONSTRAINT "workspace_invites_temp_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_invites_temp"
    ADD CONSTRAINT "workspace_invites_temp_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."workspace_invites"
    ADD CONSTRAINT "workspace_invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("workspace_id", "member_id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_feed_actor" ON "public"."activity_feed" USING "btree" ("actor_id");



CREATE INDEX "idx_activity_feed_created_at" ON "public"."activity_feed" USING "btree" ("created_at");



CREATE INDEX "idx_activity_feed_project" ON "public"."activity_feed" USING "btree" ("project_id");



CREATE INDEX "idx_activity_feed_type" ON "public"."activity_feed" USING "btree" ("type");



CREATE INDEX "idx_activity_feed_workspace" ON "public"."activity_feed" USING "btree" ("workspace_id");



CREATE INDEX "idx_ai_suggestion_contexts_context" ON "public"."ai_suggestion_contexts" USING "btree" ("context_type", "context_id");



CREATE INDEX "idx_ai_suggestion_contexts_suggestion" ON "public"."ai_suggestion_contexts" USING "btree" ("suggestion_id");



CREATE INDEX "idx_ai_suggestions_type" ON "public"."ai_suggestions" USING "btree" ("type");



CREATE INDEX "idx_ai_suggestions_workspace" ON "public"."ai_suggestions" USING "btree" ("workspace_id");



CREATE INDEX "idx_comments_author" ON "public"."comments" USING "btree" ("author_id");



CREATE INDEX "idx_comments_issue" ON "public"."comments" USING "btree" ("issue_id");



CREATE INDEX "idx_issue_metadata_issue" ON "public"."issue_metadata" USING "btree" ("issue_id");



CREATE INDEX "idx_issue_metadata_key" ON "public"."issue_metadata" USING "btree" ("key");



CREATE INDEX "idx_issues_assignee" ON "public"."issues" USING "btree" ("assignee_id");



CREATE INDEX "idx_issues_epic" ON "public"."issues" USING "btree" ("is_epic") WHERE ("is_epic" = true);



CREATE INDEX "idx_issues_parent" ON "public"."issues" USING "btree" ("parent_issue_id");



CREATE INDEX "idx_issues_project" ON "public"."issues" USING "btree" ("project_id");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_recipient" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_workspace" ON "public"."notifications" USING "btree" ("workspace_id");



CREATE INDEX "idx_profiles_onboarding" ON "public"."profiles" USING "btree" ("onboarding_completed");



CREATE INDEX "idx_projects_workspace" ON "public"."projects" USING "btree" ("workspace_id");



CREATE INDEX "idx_workspace_invites_email" ON "public"."workspace_invites" USING "btree" ("email");



CREATE INDEX "idx_workspace_invites_expires_at" ON "public"."workspace_invites" USING "btree" ("expires_at");



CREATE INDEX "idx_workspace_invites_status" ON "public"."workspace_invites" USING "btree" ("status");



CREATE INDEX "idx_workspace_invites_token" ON "public"."workspace_invites" USING "btree" ("token");



CREATE INDEX "idx_workspace_invites_workspace" ON "public"."workspace_invites" USING "btree" ("workspace_id");



CREATE OR REPLACE TRIGGER "comment_activity_trigger" AFTER INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."create_comment_activity"();



CREATE OR REPLACE TRIGGER "expire_invites_trigger" AFTER INSERT OR UPDATE ON "public"."workspace_invites" FOR EACH STATEMENT EXECUTE FUNCTION "public"."expire_invites"();



CREATE OR REPLACE TRIGGER "issue_activity_trigger" AFTER INSERT OR UPDATE ON "public"."issues" FOR EACH ROW EXECUTE FUNCTION "public"."create_issue_activity"();



CREATE OR REPLACE TRIGGER "issue_metadata_updated_at" BEFORE UPDATE ON "public"."issue_metadata" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "issue_update_trigger" AFTER UPDATE ON "public"."issues" FOR EACH ROW EXECUTE FUNCTION "public"."handle_issue_update"();



CREATE OR REPLACE TRIGGER "update_ai_suggestions_updated_at" BEFORE UPDATE ON "public"."ai_suggestions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_issues_updated_at" BEFORE UPDATE ON "public"."issues" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workspaces_updated_at" BEFORE UPDATE ON "public"."workspaces" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "workspace_invites_updated_at" BEFORE UPDATE ON "public"."workspace_invites" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activity_feed"
    ADD CONSTRAINT "activity_feed_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_feed"
    ADD CONSTRAINT "activity_feed_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_feed"
    ADD CONSTRAINT "activity_feed_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_suggestion_contexts"
    ADD CONSTRAINT "ai_suggestion_contexts_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "public"."ai_suggestions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_suggestions"
    ADD CONSTRAINT "ai_suggestions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_agenda_items"
    ADD CONSTRAINT "event_agenda_items_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_checklist_items"
    ADD CONSTRAINT "event_checklist_items_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_checklist_items"
    ADD CONSTRAINT "event_checklist_items_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_organizers"
    ADD CONSTRAINT "event_organizers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_organizers"
    ADD CONSTRAINT "event_organizers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."issue_label_assignments"
    ADD CONSTRAINT "issue_label_assignments_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issue_label_assignments"
    ADD CONSTRAINT "issue_label_assignments_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "public"."issue_labels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issue_metadata"
    ADD CONSTRAINT "issue_metadata_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issue_relationships"
    ADD CONSTRAINT "issue_relationships_source_issue_id_fkey" FOREIGN KEY ("source_issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issue_relationships"
    ADD CONSTRAINT "issue_relationships_target_issue_id_fkey" FOREIGN KEY ("target_issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_parent_issue_id_fkey" FOREIGN KEY ("parent_issue_id") REFERENCES "public"."issues"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_invites"
    ADD CONSTRAINT "workspace_invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_invites"
    ADD CONSTRAINT "workspace_invites_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id");



CREATE POLICY "Anyone can insert simple invites" ON "public"."simple_workspace_invites" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Anyone can select simple invites" ON "public"."simple_workspace_invites" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view event agenda items" ON "public"."event_agenda_items" FOR SELECT USING (true);



CREATE POLICY "Anyone can view event attendees" ON "public"."event_attendees" FOR SELECT USING (true);



CREATE POLICY "Anyone can view event checklist items" ON "public"."event_checklist_items" FOR SELECT USING (true);



CREATE POLICY "Anyone can view event organizers" ON "public"."event_organizers" FOR SELECT USING (true);



CREATE POLICY "Attendees can update their own status" ON "public"."event_attendees" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Authors can update their comments" ON "public"."comments" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Enable read access for authenticated users" ON "public"."workspaces" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable write access for owners" ON "public"."workspaces" TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Event owners can delete attendees" ON "public"."event_attendees" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_attendees"."event_id") AND ("events"."user_id" = "auth"."uid"())))));



CREATE POLICY "Event owners can delete organizers" ON "public"."event_organizers" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_organizers"."event_id") AND ("events"."user_id" = "auth"."uid"())))));



CREATE POLICY "Event owners can insert attendees" ON "public"."event_attendees" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_attendees"."event_id") AND ("events"."user_id" = "auth"."uid"())))));



CREATE POLICY "Event owners can insert organizers" ON "public"."event_organizers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_organizers"."event_id") AND ("events"."user_id" = "auth"."uid"())))));



CREATE POLICY "Event owners can manage agenda items" ON "public"."event_agenda_items" USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_agenda_items"."event_id") AND ("events"."user_id" = "auth"."uid"())))));



CREATE POLICY "Event owners can manage checklist items" ON "public"."event_checklist_items" USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_checklist_items"."event_id") AND ("events"."user_id" = "auth"."uid"())))));



CREATE POLICY "Manage workspace members" ON "public"."workspace_members" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."workspaces"
  WHERE (("workspaces"."id" = "workspace_members"."workspace_id") AND ("workspaces"."owner_id" = "auth"."uid"())))) OR ("member_id" = "auth"."uid"())));



CREATE POLICY "Members can view their workspaces" ON "public"."workspaces" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members"
  WHERE (("workspace_members"."workspace_id" = "workspaces"."id") AND ("workspace_members"."member_id" = "auth"."uid"())))));



CREATE POLICY "Owners can view their workspaces" ON "public"."workspaces" FOR SELECT TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "notifications"."workspace_id") AND ("wm"."member_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "notifications"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create workspace events" ON "public"."events" FOR INSERT WITH CHECK (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."member_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their own events" ON "public"."events" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete workspace events" ON "public"."events" FOR DELETE USING (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."member_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own events" ON "public"."events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own events" ON "public"."events" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("recipient_id" = "auth"."uid"())) WITH CHECK (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Users can update workspace events" ON "public"."events" FOR UPDATE USING (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."member_id" = "auth"."uid"())))) WITH CHECK (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."member_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own events or events they're invited to" ON "public"."events" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."event_attendees"
  WHERE (("event_attendees"."event_id" = "events"."id") AND ("event_attendees"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Users can view workspace events" ON "public"."events" FOR SELECT USING (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."member_id" = "auth"."uid"()))));



CREATE POLICY "View as workspace member or owner" ON "public"."workspace_members" FOR SELECT TO "authenticated" USING ((("member_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces"
  WHERE (("workspaces"."id" = "workspace_members"."workspace_id") AND ("workspaces"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace admins can create invites" ON "public"."workspace_invites" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "workspace_invites"."workspace_id") AND ("wm"."member_id" = "auth"."uid"()) AND ("wm"."role" = 'Admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "workspace_invites"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace admins can update invites" ON "public"."workspace_invites" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "workspace_invites"."workspace_id") AND ("wm"."member_id" = "auth"."uid"()) AND ("wm"."role" = 'Admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "workspace_invites"."workspace_id") AND ("w"."owner_id" = "auth"."uid"())))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "workspace_invites"."workspace_id") AND ("wm"."member_id" = "auth"."uid"()) AND ("wm"."role" = 'Admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "workspace_invites"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace members can create activity" ON "public"."activity_feed" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "wm"."workspace_id") AND ("wm"."member_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "activity_feed"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace members can create comments" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM (("public"."issues" "i"
     JOIN "public"."projects" "p" ON (("p"."id" = "i"."project_id")))
     JOIN "public"."workspace_members" "wm" ON (("wm"."workspace_id" = "p"."workspace_id")))
  WHERE (("i"."id" = "comments"."issue_id") AND ("wm"."member_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM (("public"."issues" "i"
     JOIN "public"."projects" "p" ON (("p"."id" = "i"."project_id")))
     JOIN "public"."workspaces" "w" ON (("w"."id" = "p"."workspace_id")))
  WHERE (("i"."id" = "comments"."issue_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace members can create issues" ON "public"."issues" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."workspace_members" "wm" ON (("wm"."workspace_id" = "p"."workspace_id")))
  WHERE (("p"."id" = "issues"."project_id") AND ("wm"."member_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."workspaces" "w" ON (("w"."id" = "p"."workspace_id")))
  WHERE (("p"."id" = "issues"."project_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace members can create projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "wm"."workspace_id") AND ("wm"."member_id" = "auth"."uid"()) AND ("wm"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "projects"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace members can manage AI suggestion contexts" ON "public"."ai_suggestion_contexts" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."ai_suggestions" "s"
  WHERE (("s"."id" = "ai_suggestion_contexts"."suggestion_id") AND (EXISTS ( SELECT 1
           FROM "public"."workspace_members" "wm"
          WHERE (("wm"."workspace_id" = "s"."workspace_id") AND ("wm"."member_id" = "auth"."uid"()))))))) OR (EXISTS ( SELECT 1
   FROM "public"."ai_suggestions" "s"
  WHERE (("s"."id" = "ai_suggestion_contexts"."suggestion_id") AND (EXISTS ( SELECT 1
           FROM "public"."workspaces" "w"
          WHERE (("w"."id" = "s"."workspace_id") AND ("w"."owner_id" = "auth"."uid"())))))))));



CREATE POLICY "Workspace members can manage AI suggestions" ON "public"."ai_suggestions" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "ai_suggestions"."workspace_id") AND ("wm"."member_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "ai_suggestions"."workspace_id") AND ("w"."owner_id" = "auth"."uid"())))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "ai_suggestions"."workspace_id") AND ("wm"."member_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "ai_suggestions"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace members can manage issue metadata" ON "public"."issue_metadata" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."issues" "i"
  WHERE (("i"."id" = "issue_metadata"."issue_id") AND (EXISTS ( SELECT 1
           FROM "public"."projects" "p"
          WHERE (("p"."id" = "i"."project_id") AND (EXISTS ( SELECT 1
                   FROM "public"."workspace_members" "wm"
                  WHERE (("wm"."workspace_id" = "p"."workspace_id") AND ("wm"."member_id" = "auth"."uid"())))))))))) OR (EXISTS ( SELECT 1
   FROM "public"."issues" "i"
  WHERE (("i"."id" = "issue_metadata"."issue_id") AND (EXISTS ( SELECT 1
           FROM "public"."projects" "p"
          WHERE (("p"."id" = "i"."project_id") AND (EXISTS ( SELECT 1
                   FROM "public"."workspaces" "w"
                  WHERE (("w"."id" = "p"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))))))))));



CREATE POLICY "Workspace members can manage issues" ON "public"."issues" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "issues"."project_id") AND (EXISTS ( SELECT 1
           FROM "public"."workspace_members" "wm"
          WHERE (("wm"."workspace_id" = "p"."workspace_id") AND ("wm"."member_id" = "auth"."uid"()))))))) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "issues"."project_id") AND (EXISTS ( SELECT 1
           FROM "public"."workspaces" "w"
          WHERE (("w"."id" = "p"."workspace_id") AND ("w"."owner_id" = "auth"."uid"())))))))));



CREATE POLICY "Workspace members can manage label assignments" ON "public"."issue_label_assignments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Workspace members can manage labels" ON "public"."issue_labels" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Workspace members can manage relationships" ON "public"."issue_relationships" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Workspace members can update projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "projects"."workspace_id") AND ("wm"."member_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "projects"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace members can view AI suggestions" ON "public"."ai_suggestions" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "ai_suggestions"."workspace_id") AND ("wm"."member_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "ai_suggestions"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace members can view activity feed" ON "public"."activity_feed" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "activity_feed"."workspace_id") AND ("wm"."member_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "activity_feed"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace members can view comments" ON "public"."comments" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."issues" "i"
  WHERE (("i"."id" = "comments"."issue_id") AND (EXISTS ( SELECT 1
           FROM "public"."projects" "p"
          WHERE (("p"."id" = "i"."project_id") AND (EXISTS ( SELECT 1
                   FROM "public"."workspace_members" "wm"
                  WHERE (("wm"."workspace_id" = "p"."workspace_id") AND ("wm"."member_id" = "auth"."uid"())))))))))) OR (EXISTS ( SELECT 1
   FROM "public"."issues" "i"
  WHERE (("i"."id" = "comments"."issue_id") AND (EXISTS ( SELECT 1
           FROM "public"."projects" "p"
          WHERE (("p"."id" = "i"."project_id") AND (EXISTS ( SELECT 1
                   FROM "public"."workspaces" "w"
                  WHERE (("w"."id" = "p"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))))))))));



CREATE POLICY "Workspace members can view invites" ON "public"."workspace_invites" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "workspace_invites"."workspace_id") AND ("wm"."member_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "workspace_invites"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace members can view projects" ON "public"."projects" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "projects"."workspace_id") AND ("wm"."member_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "projects"."workspace_id") AND ("w"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Workspace owners can manage members" ON "public"."workspace_members" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "workspaces"."owner_id"
   FROM "public"."workspaces"
  WHERE ("workspaces"."id" = "workspace_members"."workspace_id")))) WITH CHECK (("auth"."uid"() IN ( SELECT "workspaces"."owner_id"
   FROM "public"."workspaces"
  WHERE ("workspaces"."id" = "workspace_members"."workspace_id"))));



ALTER TABLE "public"."activity_feed" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_suggestion_contexts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_agenda_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_attendees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_organizers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issue_label_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issue_labels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issue_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issue_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."simple_workspace_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


























































































































































































GRANT ALL ON FUNCTION "public"."check_workspace_access"("workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_workspace_access"("workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_workspace_access"("workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_comment_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_comment_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_comment_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_issue_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_issue_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_issue_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_invites"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_invites"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_invites"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invite_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invite_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invite_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_workspace_stats"("workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_workspace_stats"("workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_workspace_stats"("workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_issue_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_issue_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_issue_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_workspace_invite_direct"("p_workspace_id" "uuid", "p_inviter_id" "uuid", "p_email" "text", "p_role" "text", "p_function" "text", "p_token" "text", "p_status" "text", "p_expires_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_workspace_invite_direct"("p_workspace_id" "uuid", "p_inviter_id" "uuid", "p_email" "text", "p_role" "text", "p_function" "text", "p_token" "text", "p_status" "text", "p_expires_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_workspace_invite_direct"("p_workspace_id" "uuid", "p_inviter_id" "uuid", "p_email" "text", "p_role" "text", "p_function" "text", "p_token" "text", "p_status" "text", "p_expires_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_workspace_invite_typed"("p_workspace_id" "uuid", "p_inviter_id" "uuid", "p_email" "text", "p_role" "public"."teamrole", "p_function" "public"."teamfunction", "p_token" "text", "p_status" "text", "p_expires_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_workspace_invite_typed"("p_workspace_id" "uuid", "p_inviter_id" "uuid", "p_email" "text", "p_role" "public"."teamrole", "p_function" "public"."teamfunction", "p_token" "text", "p_status" "text", "p_expires_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_workspace_invite_typed"("p_workspace_id" "uuid", "p_inviter_id" "uuid", "p_email" "text", "p_role" "public"."teamrole", "p_function" "public"."teamfunction", "p_token" "text", "p_status" "text", "p_expires_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_invite_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_invite_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_invite_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."activity_feed" TO "anon";
GRANT ALL ON TABLE "public"."activity_feed" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_feed" TO "service_role";



GRANT ALL ON TABLE "public"."ai_suggestion_contexts" TO "anon";
GRANT ALL ON TABLE "public"."ai_suggestion_contexts" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_suggestion_contexts" TO "service_role";



GRANT ALL ON TABLE "public"."ai_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."ai_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."event_agenda_items" TO "anon";
GRANT ALL ON TABLE "public"."event_agenda_items" TO "authenticated";
GRANT ALL ON TABLE "public"."event_agenda_items" TO "service_role";



GRANT ALL ON TABLE "public"."event_attendees" TO "anon";
GRANT ALL ON TABLE "public"."event_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."event_attendees" TO "service_role";



GRANT ALL ON TABLE "public"."event_checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."event_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."event_checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."event_organizers" TO "anon";
GRANT ALL ON TABLE "public"."event_organizers" TO "authenticated";
GRANT ALL ON TABLE "public"."event_organizers" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."issue_label_assignments" TO "anon";
GRANT ALL ON TABLE "public"."issue_label_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."issue_label_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."issue_labels" TO "anon";
GRANT ALL ON TABLE "public"."issue_labels" TO "authenticated";
GRANT ALL ON TABLE "public"."issue_labels" TO "service_role";



GRANT ALL ON TABLE "public"."issue_metadata" TO "anon";
GRANT ALL ON TABLE "public"."issue_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."issue_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."issue_relationships" TO "anon";
GRANT ALL ON TABLE "public"."issue_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."issue_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."issues" TO "anon";
GRANT ALL ON TABLE "public"."issues" TO "authenticated";
GRANT ALL ON TABLE "public"."issues" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."simple_workspace_invites" TO "anon";
GRANT ALL ON TABLE "public"."simple_workspace_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."simple_workspace_invites" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_invites" TO "anon";
GRANT ALL ON TABLE "public"."workspace_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_invites" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_invites_temp" TO "anon";
GRANT ALL ON TABLE "public"."workspace_invites_temp" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_invites_temp" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_members" TO "anon";
GRANT ALL ON TABLE "public"."workspace_members" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_members" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();



