import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  createdAt: Timestamp;
}

export interface EngineeringPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  content: string;
  codeSnippet?: string;
  language?: string;
  likesCount: number;
  createdAt: Timestamp;
}