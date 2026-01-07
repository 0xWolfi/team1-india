import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
