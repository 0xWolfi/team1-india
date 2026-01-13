
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Next.js configuration for larger file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Maximum file size: 4MB (reduced to avoid Vercel's 4.5MB body limit)
const MAX_FILE_SIZE = 4 * 1024 * 1024;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return new NextResponse(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`, { status: 400 });
        }

        // Validate file type (images only)
        if (!file.type.startsWith('image/')) {
            return new NextResponse("Only image files are allowed", { status: 400 });
        }

        // Upload to Vercel Blob Storage
        const blob = await put(file.name, file, {
            access: 'public',
            addRandomSuffix: true, // Adds random suffix to prevent name collisions
        });

        // Return the public URL from Vercel Blob
        return NextResponse.json({ url: blob.url });
    } catch (error) {
        console.error("Upload error:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        return new NextResponse("Upload failed. Please try again.", { status: 500 });
    }
}
