import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export const toggleLike = async (targetType: "posts" | "reels", targetId: string, userId: string, isLiked: boolean) => {
  const ref = doc(db, targetType, targetId, "likes", userId);
  if (isLiked) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { likedAt: serverTimestamp() });
  }
};

export const toggleSave = async (userId: string, targetType: "saved_posts" | "saved_reels", targetId: string, isSaved: boolean) => {
  const ref = doc(db, "users", userId, targetType, targetId);
  if (isSaved) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { savedAt: serverTimestamp() });
  }
};

export const toggleFollow = async (followerId: string, followingId: string, isFollowing: boolean) => {
  if (followerId === followingId) return; // Prevent self-follow
  const ref = doc(db, "follows", `${followerId}_${followingId}`);
  if (isFollowing) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { followerId, followingId, createdAt: serverTimestamp() });
  }
};

export const addNotification = async (targetUserId: string, actorId: string, type: string, targetId: string) => {
  if (targetUserId === actorId) return;
  await addDoc(collection(db, "users", targetUserId, "notifications"), {
    actorId,
    type,
    targetId,
    read: false,
    createdAt: serverTimestamp()
  });
};

export const reportContent = async (reporterId: string, targetId: string, targetType: string, reason: string) => {
  await addDoc(collection(db, "reports"), {
    reporterId,
    targetId,
    targetType,
    reason,
    status: "pending",
    createdAt: serverTimestamp()
  });
};

export const addComment = async (targetType: "posts" | "reels", targetId: string, authorId: string, content: string) => {
  return await addDoc(collection(db, targetType, targetId, "comments"), {
    authorId,
    content,
    status: "active",
    createdAt: serverTimestamp()
  });
};
