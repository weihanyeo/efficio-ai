"use client"
import React, { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export const WorkspaceSettings = () => {
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useRouter();

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;
    if (deleteText !== currentWorkspace.name) {
      setError("Please type the workspace name correctly to confirm deletion");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to delete a workspace");

      // Check if user is the owner
      const { data: members, error: membersError } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", currentWorkspace.id)
        .eq("member_id", user.id)
        .single();

      if (membersError) throw membersError;
      if (!members || members.role !== "owner") {
        throw new Error("Only the workspace owner can delete this workspace");
      }

      console.log(`Deleting workspace: ${currentWorkspace.id}`);

      // Delete all workspace members
      const { error: membersDeleteError } = await supabase
        .from("workspace_members")
        .delete()
        .eq("workspace_id", currentWorkspace.id);

      if (membersDeleteError) throw membersDeleteError;

      // Delete all workspace invites
      const { error: invitesDeleteError } = await supabase
        .from("workspace_invites")
        .delete()
        .eq("workspace_id", currentWorkspace.id);

      if (invitesDeleteError) throw invitesDeleteError;

      // Delete the workspace itself
      const { error: workspaceDeleteError } = await supabase
        .from("workspaces")
        .delete()
        .eq("id", currentWorkspace.id);

      if (workspaceDeleteError) throw workspaceDeleteError;

      // Refresh the workspaces list and navigate to the first available workspace
      await refreshWorkspaces();
      navigate.push("/dashboard");
    } catch (err) {
      console.error("Error deleting workspace:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while deleting the workspace"
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!currentWorkspace) {
    return <div className="p-6">No workspace selected</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Workspace Settings</h2>

      <div className="space-y-8 max-w-2xl">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Workspace Information</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Workspace Name
              </label>
              <div className="text-gray-400 bg-[#1E1E1E] px-4 py-2 rounded-md">
                {currentWorkspace.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Workspace ID
              </label>
              <div className="text-gray-400 bg-[#1E1E1E] px-4 py-2 rounded-md font-mono text-sm">
                {currentWorkspace.id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Created</label>
              <div className="text-gray-400 bg-[#1E1E1E] px-4 py-2 rounded-md">
                {new Date(currentWorkspace.created_at).toLocaleDateString()} at{" "}
                {new Date(currentWorkspace.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#262626] pt-8">
          <h3 className="text-lg font-medium text-red-400 flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h3>

          <div className="bg-[#1E1E1E] border border-red-500/20 rounded-md p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium mb-1">Delete this workspace</h4>
                <p className="text-sm text-gray-400">
                  Once you delete a workspace, there is no going back. All data
                  will be permanently deleted.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#161616] rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Delete Workspace</h3>
            </div>

            <p className="mb-4 text-gray-400">
              This action{" "}
              <span className="text-red-400 font-medium">cannot be undone</span>
              . This will permanently delete the{" "}
              <span className="font-medium">{currentWorkspace.name}</span>{" "}
              workspace and all associated data.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Please type{" "}
                <span className="font-mono bg-[#262626] px-1 py-0.5 rounded">
                  {currentWorkspace.name}
                </span>{" "}
                to confirm
              </label>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                className="w-full px-4 py-2 bg-[#262626] border border-[#363636] rounded-md focus:outline-none focus:border-red-500"
                placeholder={`Type "${currentWorkspace.name}" to confirm`}
              />
            </div>

            {error && (
              <div className="mb-4 text-red-400 text-sm bg-red-500/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-[#262626] text-gray-400 rounded-md hover:bg-[#363636]"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleteText !== currentWorkspace.name || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Workspace"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
