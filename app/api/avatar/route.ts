import { NextRequest, NextResponse } from "next/server";

export const revalidate = 86400; // Cache for 24 hours

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle");
  if (!handle) {
    return new NextResponse("Missing handle", { status: 400 });
  }

  const clean = handle
    .replace(/^@/, "")
    .replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, "")
    .split("/")[0]
    .split("?")[0]
    .trim();

  if (!clean) {
    return new NextResponse("Invalid handle", { status: 400 });
  }

  try {
    const res = await fetch(`https://unavatar.io/x/${clean}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        "CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
