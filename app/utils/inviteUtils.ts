import { supabase } from '../lib/supabase';
import type { InviteCodeParams, InviteCodeResponse, WorkspaceInvite, CreateInviteParams, CreateInviteResponse } from '../types';

/**
 * Generates a random invite code of specified length
 * @param length Length of the invite code
 * @returns Random alphanumeric string
 */
export const generateRandomCode = (length: number = 8): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters (0, O, 1, I)
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generates a cryptographically secure random token
 * @returns Random token string
 */
export const generateSecureToken = (): string => {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Creates an invite code for a workspace
 * @param params Parameters for creating the invite code
 * @returns The generated invite code and URL
 */
export const createInviteCode = async (params: CreateInviteParams): Promise<CreateInviteResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('invite-member', {
      body: params,
    });

    if (error) throw error;
    
    // Get the site URL from environment or fallback to localhost
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Create the invite URL
    const inviteUrl = `${siteUrl}/invite/${data.token}`;
    
    return {
      ...data,
      inviteUrl
    };
  } catch (error) {
    console.error('Error creating invite code:', error);
    throw error;
  }
};

/**
 * Validates an invite token
 * @param token The invite token to validate
 * @returns The invite details if valid, null otherwise
 */
export const validateInviteToken = async (token: string): Promise<WorkspaceInvite | null> => {
  try {
    const { data, error } = await supabase
      .from('workspace_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) return null;
    
    return data as WorkspaceInvite;
  } catch (error) {
    console.error('Error validating invite token:', error);
    return null;
  }
};

/**
 * Accepts an invite using an invite token
 * @param token The invite token to accept
 * @returns Success status and any error message
 */
export const acceptInvite = async (
  token: string
): Promise<{ success: boolean; error?: string; workspace_id?: string; profile?: any }> => {
  try {
    console.log('Accepting invite with token:', token);
    
    // Get the current session for the auth token
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { success: false, error: 'No authenticated session' };
    }
    
    // Call the Edge Function to accept the invite
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/accept-invite`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ token })
      }
    );
    
    const result = await response.json();
    console.log('Accept invite result:', result);
    
    if (!response.ok) {
      console.error('Error accepting invite:', result);
      return { 
        success: false, 
        error: result.error || 'Failed to accept invite' 
      };
    }
    
    return { 
      success: true, 
      workspace_id: result.workspace_id,
      profile: result.profile
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to accept invite' 
    };
  }
};
