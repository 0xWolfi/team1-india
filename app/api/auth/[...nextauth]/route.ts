import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

const handler = NextAuth(authOptions);

// Simple NextAuth handler without rate limiting
export const GET = handler;
export const POST = handler;
