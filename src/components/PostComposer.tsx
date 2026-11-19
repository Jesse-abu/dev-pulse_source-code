"use client";

import React, { useState } from "react";
import { Code2, Send, Loader2, AlertCircle, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createEngineeringPost } from "@/lib/firebase/posts";
import { createPostSchema } from "@/lib/validators/post";

interface PostComposerProps {
  onRequestAuth: () => void;
}

export function PostComposer({ onRequestAuth }: PostComposerProps) {
  const { user, profile, loading: authLoading } = useAuth();

  const [content, setContent] = useState("");
  const [showSnippet, setShowSnippet] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    if (!user || !profile) {
      onRequestAuth();
      return;
    }

    const validation = createPostSchema.safeParse({
      content,
      codeSnippet: showSnippet ? codeSnippet : "",
      language: showSnippet ? language : "",
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || "Check your post input.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await createEngineeringPost(validation.data, profile);
      setContent("");
      setCodeSnippet("");
      setShowSnippet(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to publish post.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="h-24 animate-pulse rounded-lg bg-zinc-800/60" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              Sign in to publish engineering logs
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Share architecture notes, benchmarks, and code snippets with the feed.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRequestAuth}
          className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Sign In to Post
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-zinc-400">
        <span>
          Posting as <strong className="font-medium text-zinc-200">{profile.displayName}</strong>{" "}
          <span className="text-zinc-500">@{profile.username}</span>
        </span>
        <span className={content.length > 900 ? "text-amber-400" : "text-zinc-500"}>
          {content.length}/1000
        </span>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What did you architect, debug, or benchmark today?"
        rows={3}
        disabled={submitting}
        className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 disabled:opacity-50"
      />

      {showSnippet && (
        <div className="mt-3 space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/90 p-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="snippet-lang" className="text-xs font-medium text-zinc-400">
              Snippet Language
            </label>
            <select
              id="snippet-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={submitting}
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-emerald-500"
            >
              <option value="cpp">C++20</option>
              <option value="rust">Rust</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="sql">SQL</option>
            </select>
          </div>
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            placeholder="// Paste focused snippet..."
            rows={5}
            disabled={submitting}
            spellCheck={false}
            className="w-full resize-y rounded border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-xs text-emerald-300 placeholder-zinc-600 outline-none focus:border-emerald-500 disabled:opacity-50"
          />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-3">
        <button
          type="button"
          onClick={() => setShowSnippet((prev) => !prev)}
          disabled={submitting}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
            showSnippet
              ? "bg-emerald-500/15 text-emerald-400"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
        >
          <Code2 className="h-4 w-4" />
          {showSnippet ? "Remove Snippet" : "Attach Snippet"}
        </button>

        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Publish Log
        </button>
      </div>
    </form>
  );
}