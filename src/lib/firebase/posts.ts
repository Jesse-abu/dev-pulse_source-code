import {
  collection,
  addDoc,
  getDocs,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  serverTimestamp,
  runTransaction,
  deleteDoc,
  Unsubscribe,
  QuerySnapshot,
  QueryDocumentSnapshot,
  DocumentReference,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createPostSchema, CreatePostInput } from "@/lib/validators/post";
import { EngineeringPost, UserProfile } from "@/types";

const POSTS_COLLECTION = "posts";
const LIKES_COLLECTION = "likes";

export async function createEngineeringPost(
  input: CreatePostInput,
  profile: UserProfile
): Promise<string> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || "Invalid post input.";
    throw new Error(firstIssue);
  }

  const cleanSnippet = parsed.data.codeSnippet?.trim() || "";
  const cleanLanguage = parsed.data.language?.trim() || "text";

  const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
    authorId: profile.uid,
    authorName: profile.displayName,
    authorHandle: profile.username,
    authorAvatar: profile.avatarUrl || "",
    content: parsed.data.content,
    codeSnippet: cleanSnippet,
    language: cleanSnippet ? cleanLanguage : "",
    likesCount: 0,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export function subscribeToEngineeringFeed(
  onData: (posts: EngineeringPost[]) => void,
  onError: (error: Error) => void,
  maxItems = 50
): Unsubscribe {
  const q = query(
    collection(db, POSTS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: EngineeringPost[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          authorId: String(data.authorId ?? ""),
          authorName: String(data.authorName ?? "Builder"),
          authorHandle: String(data.authorHandle ?? "builder"),
          authorAvatar: String(data.authorAvatar ?? ""),
          content: String(data.content ?? ""),
          codeSnippet: data.codeSnippet ? String(data.codeSnippet) : undefined,
          language: data.language ? String(data.language) : undefined,
          likesCount: typeof data.likesCount === "number" ? data.likesCount : 0,
          createdAt: data.createdAt,
        };
      });
      onData(items);
    },
    (err) => {
      onError(err);
    }
  );
}

export async function togglePostLike(postId: string, userId: string): Promise<boolean> {
  const likeId = `${postId}_${userId}`;
  const likeRef = doc(db, LIKES_COLLECTION, likeId);
  const postRef = doc(db, POSTS_COLLECTION, postId);

  return runTransaction(db, async (transaction) => {
    const likeSnap = await transaction.get(likeRef);
    const postSnap = await transaction.get(postRef);

    if (!postSnap.exists()) {
      throw new Error("Post no longer exists.");
    }

    const currentLikes =
      typeof postSnap.data().likesCount === "number" ? postSnap.data().likesCount : 0;

    if (likeSnap.exists()) {
      transaction.delete(likeRef);
      transaction.update(postRef, {
        likesCount: Math.max(0, currentLikes - 1),
      });
      return false; // unliked
    } else {
      transaction.set(likeRef, {
        postId,
        userId,
        createdAt: serverTimestamp(),
      });
      transaction.update(postRef, {
        likesCount: currentLikes + 1,
      });
      return true; // liked
    }
  });
}

export async function deleteEngineeringPost(postId: string): Promise<void> {
  await deleteDoc(doc(db, POSTS_COLLECTION, postId));
}

export function subscribeToUserLikes(
  userId: string,
  onLikesChange: (likedPostIds: Set<string>) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const likesQuery = query(
    collection(db, LIKES_COLLECTION),
    where("userId", "==", userId)
  );

  return onSnapshot(
    likesQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const nextSet = new Set<string>();
      for (const docSnap of snapshot.docs) {
        const postId = docSnap.data().postId;
        if (typeof postId === "string" && postId.length > 0) {
          nextSet.add(postId);
        }
      }
      onLikesChange(nextSet);
    },
    (err) => {
      if (onError) {
        onError(err);
      }
    }
  );
}

export interface OlderPostsPage {
  posts: EngineeringPost[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

function mapPostDoc(d: QueryDocumentSnapshot<DocumentData>): EngineeringPost {
  const data = d.data();
  return {
    id: d.id,
    authorId: String(data.authorId ?? ""),
    authorName: String(data.authorName ?? "Builder"),
    authorHandle: String(data.authorHandle ?? "builder"),
    authorAvatar: String(data.authorAvatar ?? ""),
    content: String(data.content ?? ""),
    codeSnippet: data.codeSnippet ? String(data.codeSnippet) : undefined,
    language: data.language ? String(data.language) : undefined,
    likesCount: typeof data.likesCount === "number" ? data.likesCount : 0,
    createdAt: data.createdAt,
  };
}

export async function fetchOlderEngineeringPosts(
  cursor: QueryDocumentSnapshot<DocumentData>,
  pageSize = 15
): Promise<OlderPostsPage> {
  const safeSize = Math.max(1, Math.min(pageSize, 50));
  const olderQuery = query(
    collection(db, POSTS_COLLECTION),
    orderBy("createdAt", "desc"),
    startAfter(cursor),
    limit(safeSize)
  );

  const snapshot = await getDocs(olderQuery);
  const posts = snapshot.docs.map(mapPostDoc);
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;

  return {
    posts,
    lastDoc,
    hasMore: snapshot.docs.length === safeSize,
  };
}