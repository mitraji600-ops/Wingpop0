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
    const url = new URL(req.url);
    const targetType = url.searchParams.get("targetType"); // "post" | "reel"
    const targetId = url.searchParams.get("targetId");

    if (!targetType || !targetId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    let targetRef;
    if (targetType === "post") {
      targetRef = adminDb.collection("posts").doc(targetId);
    } else if (targetType === "reel") {
      targetRef = adminDb.collection("reels").doc(targetId);
    } else {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
    }

    const docSnap = await targetRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const data = docSnap.data();
    if (data?.authorId !== uid) {
      return NextResponse.json({ error: "Forbidden: You do not own this content" }, { status: 403 });
    }

    const batch = adminDb.batch();

    // Collect ImageKit File IDs to delete
    const fileIdsToDelete: string[] = [];

    if (targetType === "reel") {
      if (data?.imageKitFileId) fileIdsToDelete.push(data.imageKitFileId);
    } else if (targetType === "post") {
      const mediaSnap = await targetRef.collection("media").get();
      mediaSnap.docs.forEach((mediaDoc) => {
        const mediaData = mediaDoc.data();
        if (mediaData.imageKitFileId) {
          fileIdsToDelete.push(mediaData.imageKitFileId);
        }
        batch.delete(mediaDoc.ref);
      });
    }

    // Delete the target document itself
    batch.delete(targetRef);

    // Commit Firestore deletions
    await batch.commit();

    // Delete from ImageKit
    const deletePromises = fileIdsToDelete.map(
      (fileId) =>
        new Promise<void>((resolve, reject) => {
          imagekit.deleteFile(fileId, (err) => {
            if (err) {
              console.error(`Failed to delete ImageKit file ${fileId}`, err);
              // We log but don't fail the overall request to prevent orphaned firestore records,
              // though a retry queue would be better for a production system.
              resolve(); 
            } else {
              resolve();
            }
          });
        })
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
