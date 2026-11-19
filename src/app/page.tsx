"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Cpu,
  LogOut,
  LogIn,
  UserPlus,
  Settings,
  Loader2,
  AlertCircle,
  ArrowDownCircle,
} from "lucide-react";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToEngineeringFeed,
  subscribeToUserLikes,
  fetchOlderEngineeringPosts,
} from "@/lib/firebase/posts";
import { EngineeringPost } from "@/types";
import { AuthModal } from "@/components/AuthModal";
import { ProfileModal } from "@/components/ProfileModal";
import { PostComposer } from "@/components/PostComposer";
import { PostCard } from "@/components/PostCard";
import {
  LanguageFilterBar,
  SnippetLanguageFilter,
} from "@/components/LanguageFilterBar";

const PAGE_SIZE = 15;

export default function HomePage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();

  const [livePosts, setLivePosts] = useState<EngineeringPost[]>([]);
  const [olderPosts, setOlderPosts] = useState<EngineeringPost[]>([]);
  const [cursor, setCursor] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [selectedLanguage, setSelectedLanguage] =
    useState<SnippetLanguageFilter>("all");

  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(
    () => new Set()
  );
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">(
    "signin"
  );
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    setFeedLoading(true);
    setFeedError(null);

    const unsubscribe = subscribeToEngineeringFeed(
      (incomingPosts) => {
        setLivePosts(incomingPosts);
        setFeedLoading(false);
      },
      (err) => {
        setFeedError(err.message || "Failed to load engineering feed.");
        setFeedLoading(false);
      },
      PAGE_SIZE
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (livePosts.length >= PAGE_SIZE && !cursor) {
      setHasMore(true);
    }
  }, [livePosts.length, cursor]);

  useEffect(() => {
    if (!user?.uid) {
      setLikedPostIds(new Set());
      return;
    }

    const unsubscribeLikes = subscribeToUserLikes(
      user.uid,
      (nextLikes) => {
        setLikedPostIds(nextLikes);
      },
      (err) => {
        console.error("Failed to subscribe to user likes:", err.message);
      }
    );

    return () => unsubscribeLikes();
  }, [user?.uid]);

  const mergedPosts = useMemo(() => {
    const seen = new Set<string>();
    const combined: EngineeringPost[] = [];

    for (const post of livePosts) {
      if (!seen.has(post.id)) {
        seen.add(post.id);
        combined.push(post);
      }
    }

    for (const post of olderPosts) {
      if (!seen.has(post.id)) {
        seen.add(post.id);
        combined.push(post);
      }
    }

    return combined;
  }, [livePosts, olderPosts]);

  const countsByLanguage = useMemo(() => {
    const counts: Partial<Record<SnippetLanguageFilter, number>> = {
      all: mergedPosts.length,
      cpp: 0,
      rust: 0,
      typescript: 0,
      python: 0,
      sql: 0,
    };

    for (const post of mergedPosts) {
      const lang = (post.language || "").toLowerCase().trim();
      if (
        lang === "cpp" ||
        lang === "rust" ||
        lang === "typescript" ||
        lang === "python" ||
        lang === "sql"
      ) {
        counts[lang] = (counts[lang] ?? 0) + 1;
      }
    }

    return counts;
  }, [mergedPosts]);

  const visiblePosts = useMemo(() => {
    if (selectedLanguage === "all") {
      return mergedPosts;
    }
    return mergedPosts.filter(
      (post) => (post.language || "").toLowerCase().trim() === selectedLanguage
    );
  }, [mergedPosts, selectedLanguage]);

  const handleLoadOlder = useCallback(async () => {
    if (loadingOlder) return;
    setLoadingOlder(true);
    setFeedError(null);

    try {
      let activeCursor = cursor;
      if (!activeCursor && mergedPosts.length > 0) {
        const { collection, query, orderBy, limit, getDocs } = await import(
          "firebase/firestore"
        );
        const { db } = await import("@/lib/firebase/client");
        const tailPost = mergedPosts[mergedPosts.length - 1];
        if (tailPost?.createdAt) {
          const anchorSnap = await getDocs(
            query(
              collection(db, "posts"),
              orderBy("createdAt", "desc"),
              limit(mergedPosts.length)
            )
          );
          activeCursor =
            anchorSnap.docs[anchorSnap.docs.length - 1] ?? null;
        }
      }

      if (!activeCursor) {
        setHasMore(false);
        return;
      }

      const page = await fetchOlderEngineeringPosts(activeCursor, PAGE_SIZE);
      setCursor(page.lastDoc);
      setHasMore(page.hasMore);
      setOlderPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const fresh = page.posts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...fresh];
      });
    } catch (err) {
      setFeedError(
        err instanceof Error ? err.message : "Failed to load older posts."
      );
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, cursor, mergedPosts]);

  const openAuth = (mode: "signin" | "signup" = "signin") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800/90 bg-zinc-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">
                DevPulse
              </span>
              <span className="ml-2 hidden text-xs text-zinc-500 sm:inline">
                Engineering Micro-Feed
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            ) : user && profile ? (
              <>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:text-white"
                >
                  <Settings className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{profile.displayName}</span>
                </button>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuth("signin")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:text-white"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Join
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <PostComposer onRequestAuth={() => openAuth("signin")} />

        <LanguageFilterBar
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          countsByLanguage={countsByLanguage}
        />

        <section aria-label="Live engineering feed" className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Live Engineering Stream
            </h1>
            <span className="text-xs text-zinc-500">
              {visiblePosts.length} of {mergedPosts.length} posts
            </span>
          </div>

          {feedError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{feedError}</span>
            </div>
          )}

          {feedLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-36 animate-pulse rounded-xl border border-zinc-800/70 bg-zinc-900/40"
                />
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center">
              <p className="text-sm font-medium text-zinc-300">
                {selectedLanguage === "all"
                  ? "No engineering logs yet."
                  : `No ${selectedLanguage.toUpperCase()} snippets in the loaded stream yet.`}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {selectedLanguage === "all"
                  ? "Be the first builder to publish a note or code snippet above."
                  : "Try switching filters or load older logs below."}
              </p>
              {selectedLanguage !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("all")}
                  className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
                >
                  Show All Logs
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.uid ?? null}
                  isLiked={likedPostIds.has(post.id)}
                  onRequestAuth={() => openAuth("signin")}
                />
              ))}
            </div>
          )}

          {hasMore && !feedLoading && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLoadOlder}
                disabled={loadingOlder}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
              >
                {loadingOlder ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 text-emerald-400" />
                )}
                {loadingOlder ? "Loading older logs..." : "Load Older Logs"}
              </button>
            </div>
          )}
        </section>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}