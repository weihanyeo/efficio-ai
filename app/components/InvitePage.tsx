'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Bot, Users, Shield, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { WorkspaceInvite, Profile, SupabaseError } from '../types';
import { validateInviteToken, acceptInvite } from '../utils/inviteUtils';

interface InviteDetails {
  id: string;
  workspace_id: string;
  inviter_id: string;
  email: string | null;
  role: string;
  function: string | null;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  workspace: {
    id: string;
    name: string;
    member_count: number | { count: number } | any[];
  };
  inviter: Profile;
}

export const InvitePage = () => {
  const navigate = useNavigate();
  const params = useParams<{ token?: string; code?: string }>();
  const { token, code } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [processingInvite, setProcessingInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(code || null);

  useEffect(() => {
    checkAuthStatus();
    if (token) {
      fetchInviteDetailsByToken();
    } else if (code) {
      fetchInviteDetailsByCode();
    }
  }, [token, code]);

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const fetchInviteDetailsByToken = async () => {
    try {
      setLoading(true);
      console.log('Fetching invite details for token:', token);
      
      const { data, error } = await supabase
        .from('workspace_invites')
        .select(`
          id,
          workspace_id,
          inviter_id,
          email,
          role,
          function,
          token,
          status,
          expires_at,
          created_at,
          workspace:workspaces(
            id,
            name,
            member_count:workspace_members(count)
          ),
          inviter:profiles(*)
        `)
        .eq('token', token)
        .single() as { data: InviteDetails | null; error: SupabaseError | null };

      if (error) {
        console.error('Database error when fetching invite details by token:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned for token:', token);
        throw new Error('Invite not found');
      }

      if (data.status !== 'pending') {
        console.error('Invite is no longer valid, status:', data.status);
        throw new Error('Invite is no longer valid');
      }

      if (new Date(data.expires_at) < new Date()) {
        console.error('Invite has expired, expires_at:', data.expires_at);
        throw new Error('Invite has expired');
      }

      console.log('Successfully fetched invite details by token:', data);
      
      // Add detailed logging about the inviter
      if (!data.inviter) {
        console.warn('Inviter data is null for invite:', {
          invite_id: data.id,
          inviter_id: data.inviter_id,
          workspace_id: data.workspace_id
        });
      } else {
        console.log('Inviter data present:', data.inviter);
      }
      
      // Log workspace data structure
      console.log('Workspace data structure:', {
        workspace: data.workspace,
        member_count_type: typeof data.workspace.member_count,
        member_count_value: data.workspace.member_count,
        is_array: Array.isArray(data.workspace.member_count)
      });
      
      setInviteDetails(data);
    } catch (error) {
      console.error('Error fetching invite details by token:', error);
      setError(error instanceof Error ? error.message : 'Failed to load invite');
    } finally {
      setLoading(false);
    }
  };

  const fetchInviteDetailsByCode = async () => {
    try {
      setLoading(true);
      console.log('Fetching invite details for code:', code);
      
      // First, validate the invite code
      const invite = await validateInviteToken(code || '');
      
      if (!invite) {
        console.error('No invite found for code:', code);
        throw new Error('Invalid or expired invite code');
      }
      
      console.log('Found invite:', invite);
      
      // Then get the workspace and inviter details
      const { data, error } = await supabase
        .from('workspace_invites')
        .select(`
          id,
          workspace_id,
          inviter_id,
          email,
          role,
          function,
          token,
          status,
          expires_at,
          created_at,
          workspace:workspaces(
            id,
            name,
            member_count:workspace_members(count)
          ),
          inviter:profiles(*)
        `)
        .eq('id', invite.id)
        .single() as { data: InviteDetails | null; error: SupabaseError | null };

      if (error) {
        console.error('Database error when fetching invite details:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned for invite ID:', invite.id);
        throw new Error('Invite not found');
      }

      console.log('Successfully fetched invite details:', data);
      
      // Add detailed logging about the inviter
      if (!data.inviter) {
        console.warn('Inviter data is null for invite:', {
          invite_id: data.id,
          inviter_id: data.inviter_id,
          workspace_id: data.workspace_id
        });
      } else {
        console.log('Inviter data present:', data.inviter);
      }
      
      // Log workspace data structure
      console.log('Workspace data structure:', {
        workspace: data.workspace,
        member_count_type: typeof data.workspace.member_count,
        member_count_value: data.workspace.member_count,
        is_array: Array.isArray(data.workspace.member_count)
      });
      
      setInviteDetails(data);
    } catch (error) {
      console.error('Error fetching invite details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load invite');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!inviteDetails) return;

    try {
      setProcessingInvite(true);
      
      // Use the token for accepting the invite
      const inviteToken = token || code || '';
      
      console.log('Accepting invite with token:', inviteToken);
      
      const result = await acceptInvite(inviteToken);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invite');
      }
      
      // If this is part of onboarding, redirect to the workspace directly
      if (result.workspace_id) {
        navigate(`/workspace/${result.workspace_id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept invite');
    } finally {
      setProcessingInvite(false);
    }
  };

  const handleDecline = async () => {
    if (!inviteDetails) return;

    try {
      const { error } = await supabase
        .from('workspace_invites')
        .update({ status: 'revoked' })
        .eq('id', inviteDetails.id);

      if (error) throw error;

      navigate('/');
    } catch (error) {
      console.error('Error declining invite:', error);
      setError('Failed to decline invite');
    }
  };

  const handleSignIn = () => {
    // Save the invite token in localStorage so we can redirect back after auth
    localStorage.setItem('pendingInvite', token || code || '');
    navigate('/auth');
  };

  const handleSignUp = () => {
    // Save the invite token in localStorage so we can redirect back after auth
    localStorage.setItem('pendingInvite', token || code || '');
    navigate('/auth?signup=true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-foreground flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading invite...</span>
        </div>
      </div>
    );
  }

  if (error || !inviteDetails) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Invite</h1>
          <p className="text-gray-400 mb-8">{error || 'Invite not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Bot className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Join Efficio.AI</h1>
          <p className="text-gray-400">You've been invited to collaborate on a project</p>
        </div>

        <div className="bg-muted border border-muted rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">{inviteDetails.workspace.name}</h2>
            </div>
            <span className="px-3 py-1 text-xs bg-indigo-500/20 text-indigo-400 rounded-full">
              {inviteDetails.role}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium">Team Size</span>
              </div>
              <p className="text-2xl font-bold">
                {Array.isArray(inviteDetails.workspace.member_count)
                  ? inviteDetails.workspace.member_count.length
                  : inviteDetails.workspace.member_count.count !== undefined
                    ? inviteDetails.workspace.member_count.count
                    : inviteDetails.workspace.member_count} members
              </p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium">Your Role</span>
              </div>
              <p className="text-2xl font-bold">{inviteDetails.function}</p>
            </div>
          </div>

          <div className="border-t border-muted pt-4">
            <div className="flex items-center gap-3">
              {inviteDetails.inviter ? (
                <>
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-indigo-400">
                      {inviteDetails.inviter.full_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{inviteDetails.inviter.full_name}</p>
                    <p className="text-sm text-gray-400">{inviteDetails.inviter.email}</p>
                  </div>
                </>
              ) : (
                <div>
                  <p className="font-medium">Workspace Admin</p>
                  <p className="text-sm text-gray-400">Invite details unavailable</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {isAuthenticated ? (
          <div className="flex gap-4">
            <button
              onClick={handleDecline}
              className="flex-1 px-4 py-2 bg-muted text-gray-400 rounded-md hover:bg-border transition-colors"
              disabled={processingInvite}
            >
              Decline
            </button>
            <button
              onClick={handleAcceptInvite}
              className="flex-1 px-4 py-2 bg-indigo-600 text-foreground rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              disabled={processingInvite}
            >
              {processingInvite ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  Accept Invitation
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg border border-border">
              <p className="text-center text-gray-400 mb-4">
                You need to sign in or create an account to join this workspace
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleSignIn}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-border transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={handleSignUp}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-foreground rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};