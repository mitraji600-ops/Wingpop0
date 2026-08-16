import { NextRequest, NextResponse } from "next/server";
import { imagekit } from "@/lib/imagekit";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    
    const batches: FirebaseFirestore.WriteBatch[] = [adminDb.batch()];
    let operationCount = 0;
    
    function addDeleteOperation(ref: FirebaseFirestore.DocumentReference) {
        if (operationCount === 499) {
            batches.push(adminDb.batch());
            operationCount = 0;
        }
        batches[batches.length - 1].delete(ref);
        operationCount++;
    }

    // 1. Find all posts by this user
    const postsSnap = await adminDb.collection("posts").where("authorId", "==", uid).get();
    const fileIdsToDelete: string[] = [];

    for (const postDoc of postsSnap.docs) {
      const mediaSnap = await postDoc.ref.collection("media").get();
      for (const mediaDoc of mediaSnap.docs) {
        const data = mediaDoc.data();
        if (data.imageKitFileId) {
          fileIdsToDelete.push(data.imageKitFileId);
        }
        addDeleteOperation(mediaDoc.ref);
      }
      addDeleteOperation(postDoc.ref);
    }

    // 2. Find all reels by this user
    const reelsSnap = await adminDb.collection("reels").where("authorId", "==", uid).get();
    for (const reelDoc of reelsSnap.docs) {
      const data = reelDoc.data();
      if (data.imageKitFileId) {
        fileIdsToDelete.push(data.imageKitFileId);
      }
      addDeleteOperation(reelDoc.ref);
    }
    
    // 3. Find and delete user's comments globally (using collectionGroup)
    const commentsSnap = await adminDb.collectionGroup("comments").where("authorId", "==", uid).get();
    for (const commentDoc of commentsSnap.docs) {
        addDeleteOperation(commentDoc.ref);
    }

    // 4. User document and username
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
        const username = userDoc.data()?.username;
        if (username) {
            addDeleteOperation(adminDb.collection("usernames").doc(username));
        }
    }
    addDeleteOperation(userRef);

    // Commit all batches
    for (const batch of batches) {
        await batch.commit();
    }

    // 5. Delete user notifications subcollection
    const notifsSnap = await adminDb.collection("users").doc(uid).collection("notifications").get();
    for (const notifDoc of notifsSnap.docs) {
      addDeleteOperation(notifDoc.ref);
    }

    // 6. Delete user saved posts & reels subcollections
    const savedPostsSnap = await adminDb.collection("users").doc(uid).collection("saved_posts").get();
    for (const doc of savedPostsSnap.docs) {
      addDeleteOperation(doc.ref);
    }
    const savedReelsSnap = await adminDb.collection("users").doc(uid).collection("saved_reels").get();
    for (const doc of savedReelsSnap.docs) {
      addDeleteOperation(doc.ref);
    }

    // Commit all batches
    for (const batch of batches) {
        await batch.commit();
    }

    // 7. Delete ImageKit files
    const deletePromises = fileIdsToDelete.map(
      (fileId) =>
        new Promise<void>((resolve) => {
          imagekit.deleteFile(fileId, (err) => {
            if (err) console.error(`Failed to delete ImageKit file ${fileId}`, err);
            resolve();
          });
        })
    );
    await Promise.all(deletePromises);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("User deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
