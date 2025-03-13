# Supabase Edge Functions

This directory contains Edge Functions for the Efficio application.

## Functions

### invite-member

This edge function generates workspace invite links with the following features:

- Authenticates the user making the request
- Verifies workspace membership
- Generates a unique invite token
- Creates a workspace invite record with role and function
- Returns a complete invite URL

#### Token Generation

Invite tokens are generated using a combination of:
- Random alphanumeric characters (10 by default)
- Timestamp in base36 format to ensure uniqueness

This creates secure, unique tokens without requiring a database function.

#### Usage

```typescript
const response = await fetch('/functions/v1/invite-member', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    workspace_id: 'your-workspace-id',
    role: 'Member', // or 'Admin', 'Owner'
    function: 'Engineering' // or other team functions
  })
});

const { inviteUrl } = await response.json();
// Use inviteUrl to share with potential team members
```

#### Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `PUBLIC_SITE_URL`: Base URL for invite links (defaults to 'https://efficio.ai')

### Deployment

To deploy the functions to your Supabase project:

```bash
supabase functions deploy invite-member
```

### Local Development

To run the functions locally:

```bash
supabase functions serve invite-member
```

## Shared Modules

The `_shared` directory contains modules that are shared between multiple functions:

- `cors.ts`: CORS headers configuration for cross-origin requests
