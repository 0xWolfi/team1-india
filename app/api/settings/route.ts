import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        // Protected but maybe accessible to Members? 
        // For now, let's say only CORE needs to see ALL settings.
        // Public page fetches via Server Component direct DB access, so no public API needed.
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
        
        // @ts-ignore
        if (session.user.role !== 'CORE') return new NextResponse("Forbidden", { status: 403 });

        const settings = await prisma.systemSettings.findMany({
            where: { deletedAt: null }
        });

        // Convert array to object for easier frontend consumption
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = String(curr.value || ""); // Handle null/json by stringifying
            return acc;
        }, {} as Record<string, string>);

        return NextResponse.json(settingsMap);
    } catch (error) {
        console.error("[SETTINGS_GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
        
        // @ts-ignore
        if (session.user.role !== 'CORE') return new NextResponse("Forbidden", { status: 403 });

        const body = await request.json();
        const { key, value } = body;

        if (!key) return new NextResponse("Missing key", { status: 400 });

        const setting = await prisma.systemSettings.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
        });

        return NextResponse.json(setting);
    } catch (error) {
        console.error("[SETTINGS_UPDATE]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
