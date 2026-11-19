import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  updateProfileSchema,
  UpdateProfileInput,
} from "@/lib/validators/profile";

export async function updateUserProfile(
  uid: string,
  input: UpdateProfileInput
): Promise<void> {
  if (!uid) {
    throw new Error("You must be signed in to update your profile.");
  }

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message || "Invalid profile details.";
    throw new Error(firstIssue);
  }

  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    displayName: parsed.data.displayName,
    bio: parsed.data.bio,
    updatedAt: serverTimestamp(),
  });
}