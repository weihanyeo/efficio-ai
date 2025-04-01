'use client';
import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Mail,
  Calendar,
  Settings,
  Shield,
  UserX,
  Copy,
  Check,
  Link,
  RefreshCw,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { Profile, TeamRole, TeamFunction, WorkspaceMember, SupabaseError } from '../types';
import { createInviteCode } from '../utils/inviteUtils';
import { toast } from 'react-toastify';
import emailjs from '@emailjs/browser';

interface TeamMemberWithProfile extends WorkspaceMember {
  profile: Profile;
}

interface InviteMemberModalProps {
  onClose: () => void;
  onInvite: (emails: string[], role: TeamRole, teamFunction: TeamFunction) => void;
}

const InviteMemberModal = ({ onClose, onInvite }: InviteMemberModalProps) => {
  const [activeTab, setActiveTab] = useState<'email' | 'link'>('link');
  const [emails, setEmails] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TeamRole>('Member');
  const [selectedFunction, setSelectedFunction] = useState<TeamFunction>('Engineering');
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (activeTab === 'link' && !inviteCode) {
      generateInviteCode();
    }
  }, [activeTab, currentWorkspace?.id]);

  const generateInviteCode = async () => {
    try {
      if (!currentWorkspace?.id) {
        console.error('No current workspace');
        return;
      }

      setIsGeneratingCode(true);

      const response = await createInviteCode({
        workspace_id: currentWorkspace.id,
        role: selectedRole,
        function: selectedFunction,
        expiry_days: 7
      });

      console.log('Invite response:', response);
      
      // Extract the token from the URL (last part after the slash)
      const tokenParts = response.inviteUrl.split('/');
      const token = tokenParts[tokenParts.length - 1];
      
      setInviteCode(token);
      setInviteLink(response.inviteUrl);
    } catch (error) {
      console.error('Error generating invite code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailList = emails.split(',').map(email => email.trim()).filter(Boolean);
    onInvite(emailList, selectedRole, selectedFunction);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshCode = () => {
    setInviteCode('');
    setInviteLink('');
    generateInviteCode();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-muted rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Invite Team Members</h2>
        
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'email'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Send Email Invites</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'link'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              <span>Invite Code</span>
            </div>
          </button>
        </div>

        {activeTab === 'email' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email Addresses</label>
              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-muted border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter email addresses separated by commas"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-muted text-gray-400 rounded-md hover:bg-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-foreground rounded-md hover:bg-primary/80"
              >
                Send Invites
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Invite Code</h3>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-400">Expires in 7 days</div>
                  <button
                    onClick={handleRefreshCode}
                    className="p-1 hover:bg-muted rounded-md"
                    disabled={isGeneratingCode}
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${isGeneratingCode ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              <div className="bg-muted border border-border rounded-md p-4 text-center text-xl font-mono">
                {isGeneratingCode ? (
                  <div className="animate-pulse">Generating...</div>
                ) : (
                  inviteCode
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-4 py-2 bg-muted border border-border rounded-md text-sm focus:outline-none"
                  placeholder={isGeneratingCode ? "Generating link..." : "No invite link generated"}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!inviteLink || isGeneratingCode}
                  className="p-2 bg-muted hover:bg-border rounded-md disabled:opacity-50"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-secondary rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Invite Settings</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as TeamRole)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Function</label>
                  <select
                    value={selectedFunction}
                    onChange={(e) => setSelectedFunction(e.target.value as TeamFunction)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Management">Management</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-muted text-gray-400 rounded-md hover:bg-border"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MemberDetailProps {
  member: TeamMemberWithProfile;
  onClose: () => void;
  currentUserRole: TeamRole;
  onPromote: (memberId: string) => void;
  onDemote: (memberId: string) => void;
  onRemove: (memberId: string) => void;
}

const MemberDetail = ({
  member,
  onClose,
  currentUserRole,
  onPromote,
  onDemote,
  onRemove
}: MemberDetailProps) => {
  const [showRoleActions, setShowRoleActions] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TeamRole>(member.role);
  
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    
    fetchCurrentUser();
  }, []);
  
  const canManageRoles = currentUserRole === 'owner' && member.member_id !== currentUserId;

  const handleRoleChange = async (newRole: TeamRole) => {
    setSelectedRole(newRole);
    if (newRole === 'owner') {
      onPromote(member.member_id);
    } else {
      onDemote(member.member_id);
    }
    setEditingRole(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl bg-muted rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {member.profile?.full_name?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">{member.profile?.full_name || 'Unknown User'}</h2>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  member.role === 'owner' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {member.role}
                </span>
                {canManageRoles && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRoleActions(!showRoleActions);
                      }}
                      className="p-1 hover:bg-muted rounded-md"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                    </button>
                    {showRoleActions && (
                      <div className="absolute right-0 mt-1 w-48 bg-muted border border-border rounded-md shadow-lg z-50">
                        {member.role === 'Member' ? (
                          <button
                            onClick={() => {
                              onPromote(member.member_id);
                              setShowRoleActions(false);
                            }}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-border flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4 text-red-400" />
                            Promote to Owner
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onDemote(member.member_id);
                              setShowRoleActions(false);
                            }}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-border flex items-center gap-2"
                          >
                            <UserX className="w-4 h-4 text-yellow-400" />
                            Demote to Member
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${member.profile?.full_name || 'this user'} from the team?`)) {
                              onRemove(member.member_id);
                              setShowRoleActions(false);
                              onClose();
                            }
                          }}
                          className="w-full px-4 py-2 text-sm text-left hover:bg-border border-t border-border flex items-center gap-2 text-red-400"
                        >
                          <UserX className="w-4 h-4" />
                          Remove from Team
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManageRoles && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to remove ${member.profile?.full_name || 'this user'} from the team?`)) {
                    onRemove(member.member_id);
                    onClose();
                  }
                }}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-md text-red-400"
              >
                <UserX className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md text-gray-400"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{member.profile?.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Role</h3>
              {canManageRoles && (
                <button 
                  onClick={() => setEditingRole(!editingRole)}
                  className="text-xs text-primary hover:text-indigo-300"
                >
                  {editingRole ? 'Cancel' : 'Edit'}
                </button>
              )}
            </div>
            
            {editingRole ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value as TeamRole)}
                  className="bg-muted border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Member">Member</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  member.role === 'owner' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {member.role}
                </span>
                <p className="text-gray-400 ml-2">{member.function || 'N/A'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TeamPage = () => {
  const [members, setMembers] = useState<TeamMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithProfile | null>(null);
  const { currentWorkspace } = useWorkspace();
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole>('Member');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_API_KEY || '');
    }
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchMembers();
      subscribeToMemberUpdates();
    }

    return () => {
      supabase.removeAllChannels();
    };
  }, [currentWorkspace?.id, currentUserId]);

  const fetchMembers = async () => {
    try {
      if (!currentWorkspace?.id) {
        console.error('No current workspace');
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

      console.log('Fetching members for workspace:', currentWorkspace.id);
      
      // First get all members with their profile information
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          member_id,
          role,
          created_at,
          member:member_id(id, full_name, email, bio, created_at, updated_at, onboarding_completed)
        `)
        .eq('workspace_id', currentWorkspace.id) as { data: any[] | null; error: SupabaseError | null };

      if (membersError) throw membersError;

      if (members) {
        console.log('Fetched members:', members);
        console.log('First member structure:', members.length > 0 ? JSON.stringify(members[0], null, 2) : 'No members');
        
        // Transform the data to match our expected format
        const validMembers = members.map(member => {
          // Extract profile from the nested structure
          const profile = member.member;
          
          return {
            workspace_id: member.workspace_id,
            member_id: member.member_id,
            role: member.role,
            created_at: member.created_at,
            function: 'Other', // Default function since it's not in the schema
            profile: profile || {
              id: member.member_id,
              full_name: 'Unknown User',
              email: 'No email',
              bio: null,
              created_at: member.created_at,
              updated_at: null,
              onboarding_completed: false
            }
          };
        });
        
        setMembers(validMembers);
        const currentMember = validMembers.find(m => m.member_id === currentUserId);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMemberUpdates = () => {
    if (!currentWorkspace?.id) return () => {};

    const channel = supabase
      .channel('workspace_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${currentWorkspace.id}`
        },
        () => {
          console.log('Workspace members changed, refreshing...');
          fetchMembers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workspace_invites',
          filter: `workspace_id=eq.${currentWorkspace.id}`
        },
        (payload) => {
          console.log('Workspace invite updated:', payload);
          if (payload.new.status === 'accepted') {
            console.log('Invite accepted, refreshing members...');
            fetchMembers();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handlePromote = async (memberId: string) => {
    try {
      if (!currentWorkspace?.id) return;

      console.log(`Promoting member ${memberId} to owner`);
      
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: 'owner' })
        .eq('member_id', memberId)
        .eq('workspace_id', currentWorkspace.id);

      if (error) {
        console.error('Error promoting member:', error);
        throw error;
      }
      
      console.log(`Successfully promoted member ${memberId}`);
      
      // Update the local state to immediately reflect the change
      setMembers(members.map(m => 
        m.member_id === memberId ? { ...m, role: 'owner' } : m
      ));
    } catch (error) {
      console.error('Error promoting member:', error);
    }
  };

  const handleDemote = async (memberId: string) => {
    try {
      if (!currentWorkspace?.id) return;

      console.log(`Demoting member ${memberId} to Member`);
      
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: 'Member' })
        .eq('member_id', memberId)
        .eq('workspace_id', currentWorkspace.id);

      if (error) {
        console.error('Error demoting member:', error);
        throw error;
      }
      
      console.log(`Successfully demoted member ${memberId}`);
      
      // Update the local state to immediately reflect the change
      setMembers(members.map(m => 
        m.member_id === memberId ? { ...m, role: 'Member' } : m
      ));
    } catch (error) {
      console.error('Error demoting member:', error);
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      if (!currentWorkspace?.id) return;

      // Don't allow removing yourself
      if (currentUserId === memberId) {
        console.error("Cannot remove yourself from the workspace");
        return;
      }

      console.log(`Removing member ${memberId} from workspace ${currentWorkspace.id}`);
      
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('member_id', memberId)
        .eq('workspace_id', currentWorkspace.id);

      if (error) {
        console.error('Error removing member:', error);
        throw error;
      }
      
      console.log(`Successfully removed member ${memberId}`);
      
      // Update the local state to immediately reflect the change
      setMembers(members.filter(m => m.member_id !== memberId));
      
      // Close the member detail modal if it's open for this member
      if (selectedMember?.member_id === memberId) {
        setSelectedMember(null);
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleInviteMembers = async (emails: string[], role: TeamRole = 'Member', teamFunction: TeamFunction = 'Engineering') => {
    try {
      if (!currentWorkspace) {
        toast.error('No workspace selected');
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No authenticated session');

      // For each email, create an invite using the edge function
      for (const email of emails) {
        try {
          console.log(`Sending invite to ${email} for workspace ${currentWorkspace.id}`);
          
          // First create the invite using the edge function
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invite-member`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              workspace_id: currentWorkspace.id,
              email,
              role: role,
              function: teamFunction,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error sending invite to ${email}:`, errorData);
            toast.error(`Failed to invite ${email}. Please try again.`);
            continue;
          }

          // Get the invite data from the response
          const inviteData = await response.json();
          console.log(`Invite created successfully for ${email}:`, inviteData);
          
          // Now send an email using EmailJS
          try {
            console.log('Sending email notification for the invite');
            
            // Get the invite URL
            const inviteUrl = inviteData.token 
              ? `${window.location.origin}/invite/${inviteData.token}`
              : `${window.location.origin}/invite?code=${inviteData.code}`;
            
            // Prepare template parameters - ensure all required fields are present
            const templateParams = {
              to_email: email,
              to_name: email.split('@')[0],
              email: email, // Add this field which might be required by the template
              user_email: email, // Add alternative field name
              recipient_email: email, // Add alternative field name
              from_name: user.user_metadata?.full_name || 'Efficio.AI Team',
              workspace_name: currentWorkspace.name,
              invite_link: inviteUrl,
              invite_code: inviteData.code || '',
              role: role,
              function: teamFunction,
              message: `You've been invited to join the ${currentWorkspace.name} workspace on Efficio.AI as a ${role} in the ${teamFunction} function.`
            };
            
            // Send email using EmailJS with proper service and template IDs
            const emailResult = await emailjs.send(
              process.env.NEXT_PUBLIC_EMAILJS_SERVICE_LINK || '',
              process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_LINK || '',
              templateParams,
              process.env.NEXT_PUBLIC_EMAILJS_API_KEY || ''
            );
            
            console.log(`Email sent successfully to ${email}:`, emailResult);
            // Enhanced toast notification for successful email sending
            toast.success(
              <div className="flex flex-col">
                <span className="font-medium">Invite Email Sent!</span>
                <span className="text-sm opacity-90">Successfully sent to {email}</span>
              </div>,
              {
                icon: <Mail className="w-5 h-5 text-green-400" />,
                className: 'border-l-4 border-green-400',
                autoClose: 5000
              }
            );
          } catch (emailError) {
            console.error(`Error sending email notification to ${email}:`, emailError);
            // Don't show an error toast here since the invite was created successfully
            // Just log the error for debugging
          }
        } catch (emailError) {
          console.error(`Error processing invite for ${email}:`, emailError);
          toast.error(`Failed to process invite for ${email}`);
        }
      }
    } catch (error) {
      console.error('Error sending invites:', error);
      toast.error('Error sending invites. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <header className="h-14 border-b border-muted flex items-center justify-between px-6">
        <h2 className="text-lg font-semibold">Team Members</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team members..."
              className="w-64 pl-10 pr-4 py-1.5 bg-muted border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary rounded-md hover:bg-primary/80 text-primary-foreground"
          >
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="bg-muted border border-muted rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted">
                <th className="text-left py-3 px-4 font-medium text-gray-400">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Joined</th>
                <th className="text-right py-3 px-4 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.member_id}
                  className="border-b border-muted last:border-0 hover:bg-secondary cursor-pointer"
                >
                  <td 
                    className="py-3 px-4"
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {member.profile?.full_name?.charAt(0)?.toUpperCase() || member.member_id.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{member.profile?.full_name || `User ${member.member_id.substring(0, 6)}`}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          member.role === 'owner' ? 'bg-red-500/20 text-red-400' : 'bg-primary-500/20 text-primary'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td 
                    className="py-3 px-4 text-gray-400"
                    onClick={() => setSelectedMember(member)}
                  >
                    {member.function || 'N/A'}
                  </td>
                  <td 
                    className="py-3 px-4"
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      {member.profile?.email || 'No email available'}
                    </div>
                  </td>
                  <td 
                    className="py-3 px-4"
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        className="p-1 hover:bg-muted rounded-md" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMember(member);
                        }}
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                      </button>
                      {currentUserRole === 'owner' && member.member_id !== currentUserId && (
                        <button 
                          className="p-1 hover:bg-muted rounded-md text-red-400" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to remove ${member.profile?.full_name || 'this user'} from the team?`)) {
                              handleRemove(member.member_id);
                            }
                          }}
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedMember && (
          <MemberDetail
            member={selectedMember}
            currentUserRole={currentUserRole}
            onPromote={handlePromote}
            onDemote={handleDemote}
            onRemove={handleRemove}
            onClose={() => setSelectedMember(null)}
          />
        )}
        {showInviteModal && (
          <InviteMemberModal
            onClose={() => setShowInviteModal(false)}
            onInvite={handleInviteMembers}
          />
        )}
      </main>
    </div>
  );
};
