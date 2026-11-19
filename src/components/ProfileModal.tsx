"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/firebase/profile";
import { updateProfileSchema } from "@/lib/validators/profile";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setErrorMsg(null);
      setSavedNotice(false);
    }
  }, [isOpen, profile]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen || !user || !profile) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;

    const parsed = updateProfileSchema.safeParse({ displayName, bio });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || "Invalid input.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSavedNotice(false);

    try {
      await updateUserProfile(user.uid, parsed.data);
      await refreshProfile();
      setSavedNotice(true);
      setTimeout(() => {
        onClose();
      }, 450);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not save profile changes."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2
              id="profile-modal-title"
              className="text-lg font-semibold tracking-tight text-white"
            >
              Profile Settings
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Handle <span className="font-mono text-zinc-300">@{profile.username}</span> is
              locked to protect URL identity.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close profile modal"
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {savedNotice && (
          <div
            role="status"
            className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Profile updated.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <label
                htmlFor="profile-display-name"
                className="font-medium uppercase tracking-wider text-zinc-400"
              >
                Display Name
              </label>
              <span className="text-zinc-500">{displayName.length}/60</span>
            </div>
            <input
              id="profile-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={saving}
              maxLength={60}
              required
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 disabled:opacity-50"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <label
                htmlFor="profile-bio"
                className="font-medium uppercase tracking-wider text-zinc-400"
              >
                Engineering Bio
              </label>
              <span className="text-zinc-500">{bio.length}/240</span>
            </div>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={saving}
              maxLength={240}
              rows={3}
              placeholder="C++20 systems, lock-free queues, distributed storage..."
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 disabled:opacity-50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || displayName.trim().length < 2}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}