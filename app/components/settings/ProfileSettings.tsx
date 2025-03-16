"use client"
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export const ProfileSettings = () => {
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setEmail(profile.email || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await updateProfile(name, email, bio);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
        <div className="space-y-6 max-w-2xl">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-indigo-400">AJ</span>
            </div>
            <button className="px-4 py-2 bg-[#262626] text-sm text-gray-400 rounded-md hover:bg-[#363636]">
              Change Avatar
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-[#262626] border border-[#363636] rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-[#262626] border border-[#363636] rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 bg-[#262626] border border-[#363636] rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
