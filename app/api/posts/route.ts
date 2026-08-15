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
    const { mediaFiles, caption, allowDownloads } = body;
    // mediaFiles should be an array of { imageKitFileId: string }

    if (!Array.isArray(mediaFiles) || mediaFiles.length === 0) {
      return NextResponse.json({ error: "No media files provided" }, { status: 400 });
    }

    const batch = adminDb.batch();
    const postRef = adminDb.collection("posts").doc();

    let firstMediaUrl = "";
    let firstMediaType = "";

    // Verify all files and add to media subcollection
    for (let i = 0; i < mediaFiles.length; i++) {
      const { imageKitFileId } = mediaFiles[i];
      if (!imageKitFileId) continue;

      try {
        const fileDetails = await new Promise<any>((resolve, reject) => {
          imagekit.getFileDetails(imageKitFileId, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });

        if (fileDetails) {
          if (fileDetails.fileType !== "image") { await new Promise((resolve) => imagekit.deleteFile(imageKitFileId, resolve)); return NextResponse.json({ error: "Posts only support images." }, { status: 400 }); } const mime = fileDetails.mimeType || "image/jpeg";
          if (i === 0) {
            firstMediaUrl = fileDetails.url;
            firstMediaType = fileDetails.fileType;
          }

          const mediaRef = postRef.collection("media").doc();
          batch.set(mediaRef, {
            imageKitFileId: fileDetails.fileId,
            imageKitPath: fileDetails.filePath,
            url: fileDetails.url,
            thumbnailUrl: fileDetails.thumbnailUrl,
            mimeType: mime,
            width: fileDetails.width || 0,
            height: fileDetails.height || 0,
            fileSize: fileDetails.size || 0,
            order: i,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      } catch (err) {
        console.error(`Failed to fetch details for file ${imageKitFileId}`, err);
        return NextResponse.json({ error: `Invalid media file: ${imageKitFileId}` }, { status: 400 });
      }
    }

    const postData = {
      authorId: uid,
      caption: caption || "",
      visibility: "public",
      allowDownloads: allowDownloads === true,
      status: "published",
      mediaCount: mediaFiles.length,
      url: firstMediaUrl, // denormalized for feed
      fileType: firstMediaType, // denormalized for feed
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    batch.set(postRef, postData);

    await batch.commit();

    return NextResponse.json({ success: true, postId: postRef.id });

  } catch (error: any) {
    console.error("Post creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
