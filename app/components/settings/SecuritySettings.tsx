"use client"
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Key, Lock, Fingerprint } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const SecuritySettings = () => {
  const navigate = useRouter();
  const { user, profile, updatePassword, deleteAccount } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [deleteInput, setDeleteInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setEmailConfirmation("");
    setDeleteError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setSuccess(false);
    setPasswordLoading(true);

    try {
      await updatePassword(oldPassword, newPassword, confirmPassword);
      setSuccess(true);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "An error occurred"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    setDeleteError(null);
    setDeleteLoading(true);

    try {
      await deleteAccount(confirmationInput);
      alert("Account deleted successfully.");
      navigate.push("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
        <div className="space-y-6 max-w-2xl">
          {/* Password Section */}
          <div className="p-4 bg-secondary rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="font-medium">Password</h3>
            </div>

            {passwordError && <p className="text-red-500">{passwordError}</p>}
            {success && (
              <p className="text-green-500">Password updated successfully!</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-primary-foreground rounded-md hover:bg-indigo-700"
                disabled={passwordLoading}
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="p-4 bg-secondary rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 bg-muted text-sm text-gray-400 rounded-md hover:bg-border">
                Enable 2FA
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="p-4 bg-secondary rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Fingerprint className="w-5 h-5 text-indigo-400" />
              <h3 className="font-medium">Active Sessions</h3>
            </div>
            <div className="space-y-3">
              {[
                {
                  device: "MacBook Pro",
                  location: "San Francisco, US",
                  lastActive: "2 minutes ago",
                },
                {
                  device: "iPhone 13",
                  location: "San Francisco, US",
                  lastActive: "1 hour ago",
                },
              ].map((session, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <div>
                    <p className="font-medium">{session.device}</p>
                    <p className="text-sm text-gray-400">
                      {session.location} • {session.lastActive}
                    </p>
                  </div>
                  <button className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded">
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Delete Account Section */}
          <div className="border border-border bg-muted p-4 rounded-md">
            <h3 className="text-lg font-semibold text-red-500">
              Delete Account
            </h3>
            <p className="text-sm text-gray-400">
              Permanently delete your account and all associated data. This
              action is irreversible.
            </p>

            {/* Show Confirm UI Only When Triggered */}
            {showDeleteConfirm ? (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2 text-red-400">
                  Type your email to confirm deletion:
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:border-red-500"
                />
                {deleteError && (
                  <p className="text-sm text-red-500 mt-2">{deleteError}</p>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAccountDeletion}
                    className="px-4 py-2 bg-red-600 text-primary-foreground rounded-md hover:bg-red-700"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 bg-gray-500 text-primary-foreground rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleDeleteClick}
                className="mt-3 px-4 py-2 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20"
              >
                Delete Account
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};
