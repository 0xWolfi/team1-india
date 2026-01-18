import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkCoreAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userPermissions = session.user.permissions || {};
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

    // SECURITY: Prevent seed execution in production
    if (process.env.NODE_ENV === 'production') {
         return new NextResponse("Not available in production", { status: 404 });
    }

    if (!isSuperAdmin) {
        return new NextResponse("Only Superadmins can seed announcements", { status: 403 });
    }

    try {
        await prisma.announcement.deleteMany({}); // Clear all

        const announcements = [
            // 5 PUBLIC
            { title: "Public Announcement 1: Hackathon Starts Soon", link: "https://hackathon.team1india.com", audience: "PUBLIC" },
            { title: "Public Announcement 2: New Partnership", link: "https://avax.network", audience: "PUBLIC" },
            { title: "Public Announcement 3: Monthly Update", link: "", audience: "PUBLIC" },
            { title: "Public Announcement 4: Website Live", link: "", audience: "PUBLIC" },
            { title: "Public Announcement 5: Meetup in Bangalore", link: "", audience: "PUBLIC" },

            // 5 MEMBER
            { title: "Member Update 1: Internal Sync", link: "", audience: "MEMBER" },
            { title: "Member Update 2: Q1 Allocations", link: "", audience: "MEMBER" },
            { title: "Member Update 3: Profile Reminder", link: "/settings", audience: "MEMBER" },
            { title: "Member Update 4: Voting Now Open", link: "/core/poll", audience: "MEMBER" },
            { title: "Member Update 5: Exclusive Workshop", link: "", audience: "MEMBER" },
        ];

        for (const a of announcements) {
            await prisma.announcement.create({ data: a });
        }

        return NextResponse.json({ success: true, count: announcements.length });
    } catch (e) {
        console.error("Seed Announcements Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
