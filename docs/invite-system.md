# Efficio.AI Workspace Invite System

This document outlines the Discord-style invite system implemented for Efficio.AI workspaces.

## Overview

The invite system allows workspace members to invite others through two methods:
1. Direct email invitations
2. Shareable invite links (Discord-style)

## Features

- **Two-tab invite modal**: Email invites and invite links
- **Customizable invites**: Set role and function for invitees
- **Secure invite links**: Generated via edge function with 7-day expiration
- **Seamless authentication flow**: Handles both logged-in and anonymous users

## Technical Implementation

### Components

1. **InviteMemberModal** (`TeamPage.tsx`)
   - UI for generating invites
   - Tabbed interface for email/link invites
   - Role and function selection

2. **InvitePage** (`InvitePage.tsx`)
   - Landing page for invite links
   - Displays workspace information
   - Handles authentication state
   - Redirects to auth if needed

3. **Edge Function** (`supabase/functions/invite-member/index.ts`)
   - Generates secure invite links
   - Creates workspace_invite records
   - Handles authentication and permissions
   - Implements token generation algorithm

### Token Generation

Invite tokens are generated using a custom algorithm:
1. Generate a random alphanumeric string (10 characters by default)
2. Append a timestamp in base36 format to ensure uniqueness
3. Format as `randomString-timestamp`

This approach:
- Creates human-readable tokens
- Ensures uniqueness without database conflicts
- Provides sufficient entropy for security
- Doesn't require a database function

Example token: `a7Bc9eF2hJ-lq9xzp1`

### Database Schema

The invite system uses the following tables:

```sql
-- Workspace invites table
create table workspace_invites (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  inviter_id uuid references auth.users(id) on delete cascade not null,
  email text,
  token text unique not null,
  role text not null default 'Member',
  function text not null default 'General',
  status text not null default 'pending',
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone default (now() + interval '7 days') not null
);

-- Row-level security policies
alter table workspace_invites enable row level security;

-- Only workspace members can create invites
create policy "Workspace members can create invites"
  on workspace_invites for insert
  to authenticated
  using (
    exists (
      select 1 from workspace_members
      where workspace_members.workspace_id = workspace_invites.workspace_id
      and workspace_members.member_id = auth.uid()
    )
  );

-- Anyone can read invites by token
create policy "Anyone can read invites by token"
  on workspace_invites for select
  to anon, authenticated
  using (true);
```

## Invite Flow

1. **Creating an Invite**:
   - User opens the InviteMemberModal
   - Selects invite method (Email or Link)
   - Sets role and function
   - For links: Generates link via edge function
   - For emails: Sends batch invites (future enhancement)

2. **Accepting an Invite**:
   - User clicks invite link
   - If not logged in: Redirected to auth with pending invite stored
   - If logged in: Can accept/decline invite
   - On accept: Added to workspace with specified role/function

3. **Authentication Flow**:
   - Stores pending invite in localStorage
   - After auth, redirects back to invite page
   - Clears localStorage after processing

## Security Considerations

- Invites expire after 7 days
- Invite tokens are unique and randomly generated
- Row-level security ensures only workspace members can create invites
- Edge function validates permissions before generating invites

## Future Enhancements

- Email sending functionality
- Invite link revocation
- Invite analytics and tracking
- Admin approval for certain invite types
- Bulk invite management
