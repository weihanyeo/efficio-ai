'use client';
import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  Users,
  CalendarDays, Settings,
  ChevronDown,
  Plus,
  Link2,
  Copy,
  Check,
  Bot,
} from "lucide-react";
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { Workspace } from '../types';

interface CreateWorkspaceModalProps {
  onClose: () => void;
  onSubmit: (workspace: { name: string; description: string }) => void;
}

const CreateWorkspaceModal = ({
  onClose,
  onSubmit,
}: CreateWorkspaceModalProps) => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[#161616] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Workspace</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-[#262626] border border-[#363636] rounded-md text-sm focus:outline-none focus:border-indigo-500"
              placeholder="e.g., Engineering Team"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-[#262626] border border-[#363636] rounded-md text-sm focus:outline-none focus:border-indigo-500"
              placeholder="What's this workspace for?"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#262626] text-gray-400 rounded-md hover:bg-[#363636]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InviteMemberModalProps {
  onClose: () => void;
  onInvite: (emails: string[]) => void;
}

const InviteMemberModal = ({ onClose, onInvite }: InviteMemberModalProps) => {
  const [emails, setEmails] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const inviteLink = "https://efficio.ai/invite/abc123"; // This would be generated

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailList = emails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    onInvite(emailList);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[#161616] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Invite Team Members</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Addresses
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-[#262626] border border-[#363636] rounded-md text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Enter email addresses separated by commas"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium mb-2">
              Or share invite link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-4 py-2 bg-[#262626] border border-[#363636] rounded-md text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 bg-[#262626] hover:bg-[#363636] rounded-md"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#1E1E1E] rounded-lg flex items-start gap-2">
            <Bot className="w-4 h-4 text-indigo-400 mt-1" />
            <p className="text-xs text-gray-400">
              Team members will receive an email invitation to join your
              workspace. They can also use the invite link which expires in 7
              days.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#262626] text-gray-400 rounded-md hover:bg-[#363636]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Send Invites
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const [isWorkspaceOpen, setIsWorkspaceOpen] = React.useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = React.useState(false);
  const [showInviteMembers, setShowInviteMembers] = React.useState(false);
  
  const { currentWorkspace, workspaces, setCurrentWorkspace, createWorkspace, inviteMember, loading } = useWorkspace();

  const handleCreateWorkspace = async (workspace: { name: string; description: string }) => {
    try {
      await createWorkspace(workspace.name, 'team');
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleInviteMembers = async (emails: string[]) => {
    if (!currentWorkspace) return;
    
    try {
      await Promise.all(
        emails.map(email => inviteMember(currentWorkspace.id, email))
      );
    } catch (error) {
      console.error('Failed to invite members:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-60 bg-[#161616] border-r border-[#262626] flex flex-col items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-60 bg-[#161616] border-r border-[#262626] flex flex-col">
      <div className="p-4 border-b border-[#262626]">
        <div className="relative">
          <button
            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            className="w-full p-2 flex items-center justify-between hover:bg-[#262626] rounded-md group transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-500/20 rounded flex items-center justify-center text-indigo-400 text-sm font-medium">
                {currentWorkspace?.name.charAt(0)}
              </div>
              <span className="font-medium">{currentWorkspace?.name}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isWorkspaceOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isWorkspaceOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E1E] border border-[#363636] rounded-md shadow-lg z-50">
              <div className="p-1">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      setCurrentWorkspace(workspace);
                      setIsWorkspaceOpen(false);
                    }}
                    className="w-full p-2 flex items-center gap-2 rounded hover:bg-[#262626] transition-colors"
                  >
                    <div className="w-6 h-6 bg-indigo-500/20 rounded flex items-center justify-center text-indigo-400 text-sm font-medium">
                      {workspace.name.charAt(0)}
                    </div>
                    <span className="text-sm">{workspace.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setIsWorkspaceOpen(false);
                    setShowCreateWorkspace(true);
                  }}
                  className="w-full mt-1 p-2 flex items-center gap-2 rounded hover:bg-[#262626] transition-colors border-t border-[#363636] text-gray-400"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-2 py-4">
        <div className="space-y-1">
          <NavItem
            to="/dashboard"
            icon={<LayoutDashboard />}
            label="Dashboard"
          />
          <NavItem to="/calendar" icon={<CalendarDays />} label="Calendar" />
          <NavItem to="/issues" icon={<Inbox />} label="Issues" />
          <NavItem to="/projects" icon={<FolderKanban />} label="Projects" />
          <NavItem to="/team" icon={<Users />} label="Team" />
          <NavItem to="/settings" icon={<Settings />} label="Settings" />
        </div>
      </nav>

      {showCreateWorkspace && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspace(false)}
          onSubmit={handleCreateWorkspace}
        />
      )}

      {showInviteMembers && (
        <InviteMemberModal
          onClose={() => setShowInviteMembers(false)}
          onInvite={handleInviteMembers}
        />
      )}
    </div>
  );
};

const NavItem = ({
  icon,
  label,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
}) => {
  return (
    <Link
      href={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? "bg-[#262626] text-white"
            : "text-gray-400 hover:bg-[#1E1E1E] hover:text-white"
        }`
      }
    >
      {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
      {label}
    </Link>
  );
};
