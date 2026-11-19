"use client";

import React, { useState, useEffect } from "react";
import { X, Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

function getFriendlyAuthError(err: unknown): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Double-check your credentials and try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled before completion.";
    case "auth/network-request-failed":
      return "Network error while contacting Firebase. Check your connection.";
    default:
      return err instanceof Error && err.message
        ? err.message
        : "Authentication failed. Please try again.";
  }
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "signin",
}: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setLocalError(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const resetFormState = () => {
    setDisplayName("");
    setEmail("");
    setPassword("");
    setLocalError(null);
  };

  const handleSwitchMode = (nextMode: "signin" | "signup") => {
    setMode(nextMode);
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setLocalError("Both email and password are required.");
      return;
    }

    if (mode === "signup" && displayName.trim().length < 2) {
      setLocalError("Please enter a display name (at least 2 characters).");
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      if (mode === "signin") {
        await signInWithEmail(trimmedEmail, password);
      } else {
        await signUpWithEmail(trimmedEmail, password, displayName.trim());
      }
      resetFormState();
      onClose();
    } catch (err) {
      setLocalError(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (submitting) return;
    setSubmitting(true);
    setLocalError(null);

    try {
      await signInWithGoogle();
      resetFormState();
      onClose();
    } catch (err) {
      setLocalError(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2
              id="auth-modal-title"
              className="text-xl font-semibold tracking-tight text-white"
            >
              {mode === "signin" ? "Sign in to DevPulse" : "Create your builder account"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {mode === "signin"
                ? "Post architecture logs, share snippets, and sync with your feed."
                : "Start logging engineering notes and technical experiments."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {localError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span>{localError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="auth-display-name"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400"
              >
                Display Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="auth-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ada Lovelace"
                  disabled={submitting}
                  autoComplete="name"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="builder@domain.dev"
                disabled={submitting}
                autoComplete="email"
                required
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs uppercase tracking-wider text-zinc-500">or</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-700 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
          )}
          Continue with Google
        </button>

        <div className="mt-5 border-t border-zinc-800 pt-4 text-center text-sm text-zinc-400">
          {mode === "signin" ? (
            <>
              New to DevPulse?{" "}
              <button
                type="button"
                onClick={() => handleSwitchMode("signup")}
                disabled={submitting}
                className="font-medium text-emerald-400 hover:underline disabled:opacity-50"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => handleSwitchMode("signin")}
                disabled={submitting}
                className="font-medium text-emerald-400 hover:underline disabled:opacity-50"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}