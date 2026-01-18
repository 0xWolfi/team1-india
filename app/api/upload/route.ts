
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { put } from "@vercel/blob";
import { log } from "@/lib/logger";

// Next.js configuration for larger file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Maximum file size: 4MB (reduced to avoid Vercel's 4.5MB body limit)
const MAX_FILE_SIZE = 4 * 1024 * 1024;

/**
 * Magic byte validation for image files
 * Checks the first bytes of the file to verify it's actually an image
 */
async function validateMagicBytes(file: File): Promise<boolean> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Check file signature (magic bytes)
        // JPEG: FF D8 FF
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            return true;
        }
        
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            return true;
        }
        
        // GIF: 47 49 46 38 (GIF8)
        if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
            return true;
        }
        
        // WebP: RIFF...WEBP
        if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
            // Check for WEBP at position 8
            if (bytes.length > 8 && 
                bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
                return true;
            }
        }
        
        // SVG: Check for XML declaration or <svg tag (text-based, so check first few bytes)
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const textStart = textDecoder.decode(bytes.slice(0, Math.min(100, bytes.length)));
        if (textStart.trim().startsWith('<?xml') || textStart.trim().startsWith('<svg')) {
            return true;
        }
        
        return false;
    } catch (error) {
        log("ERROR", "Magic byte validation failed", "UPLOAD", { 
            fileName: file.name 
        }, error instanceof Error ? error : new Error(String(error)));
        return false;
    }
}

export async function POST(request: Request) {
    // Authentication check - prevent public file upload abuse
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    if (role !== 'CORE' && role !== 'MEMBER') {
        return new NextResponse("Forbidden", { status: 403 });
    }

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

        // Validate file type (images only) - check MIME type
        if (!file.type.startsWith('image/')) {
            return new NextResponse("Only image files are allowed", { status: 400 });
        }

        // Additional validation: Check file extension matches MIME type
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!validExtensions.includes(fileExtension)) {
            log("WARN", "Invalid file extension", "UPLOAD", { 
                fileName: file.name,
                extension: fileExtension,
                email: session.user.email
            });
            return new NextResponse("Invalid file extension", { status: 400 });
        }

        // Magic byte validation to prevent MIME type spoofing
        const isValidImage = await validateMagicBytes(file);
        if (!isValidImage) {
            log("WARN", "Magic byte validation failed - file is not a valid image", "UPLOAD", { 
                fileName: file.name,
                mimeType: file.type,
                email: session.user.email
            });
            return new NextResponse("File is not a valid image", { status: 400 });
        }

        // Upload to Vercel Blob Storage
        const blob = await put(file.name, file, {
            access: 'public',
            addRandomSuffix: true, // Adds random suffix to prevent name collisions
        });

        log("INFO", "File uploaded successfully", "UPLOAD", { 
            fileName: file.name,
            fileSize: file.size,
            email: session.user.email,
            blobUrl: blob.url
        });

        // Return the public URL from Vercel Blob
        return NextResponse.json({ url: blob.url });
    } catch (error) {
        log("ERROR", "File upload failed", "UPLOAD", { 
            email: session.user.email 
        }, error instanceof Error ? error : new Error(String(error)));
        return new NextResponse("Upload failed. Please try again.", { status: 500 });
    }
}
