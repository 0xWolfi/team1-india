import { NextResponse } from 'next/server';
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Next.js configuration for larger file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Maximum file size: 100MB for videos
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: Request) {
    try {
        // Only allow authenticated superadmins to upload videos
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // @ts-ignore
        const userPermissions = session.user.permissions || {};
        const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

        if (!isSuperAdmin) {
            return new NextResponse("Forbidden - Only superadmins can upload videos", { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return new NextResponse(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`, { status: 400 });
        }

        // Validate file type (videos only)
        if (!file.type.startsWith('video/')) {
            return new NextResponse("Only video files are allowed", { status: 400 });
        }

        // Upload to Vercel Blob Storage
        const blob = await put(file.name, file, {
            access: 'public',
            addRandomSuffix: false, // Keep original name for hero video
            cacheControlMaxAge: 31536000, // Cache for 1 year
        });

        // Return the public URL from Vercel Blob
        return NextResponse.json({ 
            url: blob.url,
            message: "Video uploaded successfully. Add this URL to your .env file as NEXT_PUBLIC_HERO_VIDEO_URL"
        });
    } catch (error) {
        console.error("Video upload error:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        return new NextResponse("Upload failed. Please try again.", { status: 500 });
    }
}
