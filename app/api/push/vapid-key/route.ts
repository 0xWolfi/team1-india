import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return Response.json(
      { error: 'VAPID public key not configured' },
      { status: 500 }
    );
  }

  return Response.json({ publicKey });
}
