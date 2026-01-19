import { NextRequest, NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await handleUpload({
      request,
      body,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Optional: persist blob URL here if needed
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Upload token error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload token", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
