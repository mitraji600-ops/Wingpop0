import { NextRequest, NextResponse } from "next/server";
import { imagekit } from "@/lib/imagekit";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const { imageKitFileId, caption } = body;

    if (!imageKitFileId) {
      return NextResponse.json({ error: "Missing file ID" }, { status: 400 });
    }

    // 1. Verify file with ImageKit
    interface ImageKitVideoDetails {
      fileId: string;
      filePath: string;
      url: string;
      thumbnailUrl?: string;
      fileType: string;
      mimeType?: string;
      duration?: number;
      customMetadata?: Record<string, unknown>;
    }

    const fileDetails = await new Promise<ImageKitVideoDetails>((resolve, reject) => {
      imagekit.getFileDetails(imageKitFileId, (error, result) => {
        if (error) reject(error);
        else resolve(result as ImageKitVideoDetails);
      });
    });

    if (!fileDetails) {
      return NextResponse.json({ error: "File not found in ImageKit" }, { status: 404 });
    }

    // 2. Validate upload path namespace
    const expectedFolderPrefix = `/users/${uid}/`;
    if (!fileDetails.filePath.startsWith(expectedFolderPrefix)) {
      await new Promise((resolve) => imagekit.deleteFile(imageKitFileId, resolve));
      return NextResponse.json({ error: "Unauthorized file upload location." }, { status: 403 });
    }

    // 3. Validate video type and mime
    if (fileDetails.fileType !== "video") {
      await new Promise((resolve) => imagekit.deleteFile(imageKitFileId, resolve));
      return NextResponse.json({ error: "Uploaded file is not a video" }, { status: 400 });
    }

    if (fileDetails.mimeType && !fileDetails.mimeType.startsWith("video/")) {
      await new Promise((resolve) => imagekit.deleteFile(imageKitFileId, resolve));
      return NextResponse.json({ error: "Invalid video MIME type" }, { status: 400 });
    }

    // 4. Verify duration <= 60s
    const customDuration = typeof fileDetails.customMetadata?.duration === "number" ? fileDetails.customMetadata.duration : undefined;
    const duration = customDuration ?? fileDetails.duration ?? 0;
    
    if (duration > 60) {
      await new Promise((resolve) => imagekit.deleteFile(imageKitFileId, resolve));
      return NextResponse.json({ error: "Video exceeds 60 seconds limit" }, { status: 400 });
    }

    // 4. Create Reel Document via Admin SDK
    const reelRef = adminDb.collection("reels").doc();
    const reelData = {
      authorId: uid,
      imageKitFileId: fileDetails.fileId,
      videoUrl: fileDetails.url,
      thumbnailUrl: fileDetails.thumbnailUrl || fileDetails.url + "/ik-thumbnail.jpg",
      duration: duration,
      caption: caption || "",
      status: "published",
      createdAt: FieldValue.serverTimestamp(),
    };

    await reelRef.set(reelData);

    return NextResponse.json({ success: true, reelId: reelRef.id });

  } catch (error: unknown) {
    console.error("Reel creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
