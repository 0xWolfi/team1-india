/**
 * Script to upload hero video to Vercel Blob Storage
 * 
 * Usage:
 * 1. Make sure you have BLOB_READ_WRITE_TOKEN in your .env file
 * 2. Run: npx tsx scripts/upload-hero-video.ts
 * 3. Copy the returned URL and add it to .env as NEXT_PUBLIC_HERO_VIDEO_URL
 */

import { put } from "@vercel/blob";
import { readFileSync } from "fs";
import { join } from "path";

async function uploadHeroVideo() {
    try {
        const videoPath = join(process.cwd(), "public", "hero-video.webm");
        
        console.log("Reading video file...");
        const videoBuffer = readFileSync(videoPath);
        const videoFile = new File([videoBuffer], "hero-video.webm", { type: "video/webm" });

        console.log("Uploading to Vercel Blob Storage...");
        const blob = await put("hero-video.webm", videoFile, {
            access: 'public',
            addRandomSuffix: false,
            cacheControlMaxAge: 31536000, // Cache for 1 year
        });

        console.log("\n✅ Video uploaded successfully!");
        console.log("\n📋 Add this to your .env file:");
        console.log(`NEXT_PUBLIC_HERO_VIDEO_URL=${blob.url}\n`);
        
        return blob.url;
    } catch (error) {
        console.error("❌ Upload failed:", error);
        process.exit(1);
    }
}

uploadHeroVideo();
