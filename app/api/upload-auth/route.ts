import { getUploadAuthParams } from "@imagekit/next/server"
import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        try {
            await adminAuth.verifyIdToken(token);
        } catch (err) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
        const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
        
        if (!privateKey || !publicKey) {
            return NextResponse.json({ error: "ImageKit keys are not configured." }, { status: 500 });
        }

        const { token: ikToken, expire, signature } = getUploadAuthParams({
            privateKey,
            publicKey,
            expire: 30 * 60, // 30 minutes
        })

        return NextResponse.json({ token: ikToken, expire, signature, publicKey })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
