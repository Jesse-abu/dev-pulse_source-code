"use client";

import React, { useState } from "react";
import { Heart, Trash2, Terminal } from "lucide-react";
import { EngineeringPost } from "@/types";
import { togglePostLike, deleteEngineeringPost } from "@/lib/firebase/posts";

interface PostCardProps {
  post: EngineeringPost;
  currentUserId: string | null;
  isLiked: boolean;
  onRequestAuth: () => void;
}

function formatTimestamp(ts: EngineeringPost["createdAt"]): string {
  if (!ts || typeof ts.toDate !== "function") {
    return "Just now";
  }
  const date = ts.toDate();
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostCard({
  post,
  currentUserId,
  isLiked,
  onRequestAuth,
}: PostCardProps) {
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = Boolean(currentUserId && currentUserId === post.authorId);
  const initialLetter = post.authorName.charAt(0).toUpperCase() || "B";

  const handleLikeClick = async () => {
    if (!currentUserId) {
      onRequestAuth();
      return;
    }
    if (liking) return;
    setLiking(true);
    try {
      await togglePostLike(post.id, currentUserId);
    } finally {
      setLiking(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!isAuthor || deleting) return;
    setDeleting(true);
    try {
      await deleteEngineeringPost(post.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-5 transition hover:border-zinc-700/80">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-sm font-semibold text-emerald-400">
            {initialLetter}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-white">
                {post.authorName}
              </span>
              <span className="text-xs text-zinc-500">@{post.authorHandle}</span>
            </div>
            <time className="text-xs text-zinc-500">
              {formatTimestamp(post.createdAt)}
            </time>
          </div>
        </div>

        {isAuthor && (
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleting}
            aria-label="Delete post"
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      <p className="mt-3.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
        {post.content}
      </p>

      {post.codeSnippet && (
        <div className="mt-3.5 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              {post.language || "code"}
            </span>
          </div>
          <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-emerald-300">
            <code>{post.codeSnippet}</code>
          </pre>
        </div>
      )}

      <footer className="mt-4 flex items-center gap-4 border-t border-zinc-800/70 pt-3">
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={liking}
          aria-pressed={isLiked}
          aria-label={isLiked ? "Unlike post" : "Like post"}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
            isLiked
              ? "bg-rose-500/15 text-rose-400 hover:bg-rose-500/20"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-rose-400"
          }`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-400 text-rose-400" : ""}`} />
          <span>{post.likesCount}</span>
        </button>
      </footer>
    </article>
  );
}