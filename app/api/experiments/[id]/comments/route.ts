import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const commentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty"),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const json = await request.json();
    const body = commentSchema.parse(json);

    // Get user
    const user = await prisma.member.findUnique({
        where: { email: session.user?.email! }
    });

    if (!user) return new NextResponse("User not found", { status: 404 });

    const comment = await prisma.experimentComment.create({
      data: {
        body: body.body,
        experimentId: id,
        authorId: user.id
      },
      include: {
        author: { select: { name: true, image: true } }
      }
    });

    return NextResponse.json(comment);
  } catch (error) {
     if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse(null, { status: 500 });
  }
}
