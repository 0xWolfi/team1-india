import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Authorization — fail closed when CRON_SECRET is missing
    const authHeader = request.headers.get('authorization') ?? '';
    const secret = process.env.CRON_SECRET;
    const expected = `Bearer ${secret}`;
    if (
        !secret ||
        authHeader.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
    ) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // 0. Clean up expired announcements
        await prisma.announcement.deleteMany({
            where: { expiresAt: { lt: new Date() } }
        });

        // 1. List recent blobs (limit to 100 to prevent timeout)
        const { blobs } = await list({ limit: 100 });
        
        // 2. Filter for blobs older than 24 hours (safety buffer)
        // This ensures we don't delete files currently being uploaded/saved
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        const candidateBlobs = blobs.filter(blob => {
            return (now - blob.uploadedAt.getTime()) > ONE_DAY_MS;
        });

        if (candidateBlobs.length === 0) {
            return NextResponse.json({ message: "No stale blobs found", deleted: 0 });
        }

        const candidateUrls = candidateBlobs.map(b => b.url);
        const usedUrls = new Set<string>();

        // 3. Check Database for usage (Batch Queries)
        
        // Member Images
        const members = await prisma.member.findMany({
            where: { image: { in: candidateUrls } },
            select: { image: true }
        });
        members.forEach(m => m.image && usedUrls.add(m.image));

        // Playbook Covers
        const playbooks = await prisma.playbook.findMany({
            where: { coverImage: { in: candidateUrls } },
            select: { coverImage: true }
        });
        playbooks.forEach(p => p.coverImage && usedUrls.add(p.coverImage));

        // Guide Covers
        const guides = await prisma.guide.findMany({
            where: { coverImage: { in: candidateUrls } },
            select: { coverImage: true }
        });
        guides.forEach(g => g.coverImage && usedUrls.add(g.coverImage));

        // Project Logos
        const projects = await prisma.project.findMany({
            where: { logo: { in: candidateUrls } },
            select: { logo: true }
        });
        projects.forEach(p => p.logo && usedUrls.add(p.logo));

        // Partner Logos
        const partners = await prisma.partner.findMany({
            where: { logo: { in: candidateUrls } },
            select: { logo: true }
        });
        partners.forEach(p => p.logo && usedUrls.add(p.logo));

        // MediaItems (Links Array) - Using hasSome for batch check
        // Note: 'links' is String[], so verify if prisma supports hasSome with array
        // Prisma: "Filter records where at least one of the string list values is in the given list"
        const mediaItems = await prisma.mediaItem.findMany({
            where: { 
                links: { hasSome: candidateUrls } 
            },
            select: { links: true }
        });
        // Flatten and check
        mediaItems.forEach(item => {
            item.links.forEach(link => {
                if (candidateUrls.includes(link)) usedUrls.add(link);
            });
        });


        // 4. Identify Orphans
        const orphans = candidateUrls.filter(url => !usedUrls.has(url));

        // 5. Delete Orphans
        if (orphans.length > 0) {
            await del(orphans);
        }

        return NextResponse.json({ 
            message: "Cleanup complete", 
            scanned: candidateBlobs.length,
            deleted: orphans.length,
            orphans 
        });

    } catch (error) {
        console.error("Cleanup job failed", error);
        return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
    }
}
