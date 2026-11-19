"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function ensureUserProfile(firebaseUser: User): Promise<UserProfile> {
  const userRef = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return snapshot.data() as UserProfile;
  }

  const baseHandle = (
    firebaseUser.email?.split("@")[0] ||
    `builder_${firebaseUser.uid.slice(0, 6)}`
  )
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

  const newProfile: Omit<UserProfile, "createdAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid: firebaseUser.uid,
    username: `${baseHandle}_${firebaseUser.uid.slice(0, 4)}`,
    displayName: firebaseUser.displayName || "Systems Builder",
    bio: "Shipping clean code and engineering logs.",
    avatarUrl: firebaseUser.photoURL || "",
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, newProfile);
  const createdSnap = await getDoc(userRef);
  return createdSnap.data() as UserProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }
    const userRef = doc(db, "users", auth.currentUser.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setProfile(snap.data() as UserProfile);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userProfile = await ensureUserProfile(firebaseUser);
          setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to sync user profile.";
        setError(message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    setError(null);
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userRef = doc(db, "users", credential.user.uid);
    const handle =
      email
        .split("@")[0]
        ?.toLowerCase()
        .replace(/[^a-z0-9_]/g, "_") || "dev";

    await setDoc(userRef, {
      uid: credential.user.uid,
      username: `${handle}_${credential.user.uid.slice(0, 4)}`,
      displayName: displayName.trim() || "Systems Builder",
      bio: "Shipping clean code and engineering logs.",
      avatarUrl: "",
      createdAt: serverTimestamp(),
    });
  };

  const signOut = async () => {
    setError(null);
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}