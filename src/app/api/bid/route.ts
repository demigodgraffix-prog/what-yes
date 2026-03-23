export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Bid received:', body);

    const { auctionId, userId, amount, username } = body;

    const bid = {
      id: `bid_${Date.now()}`,
      auctionId,
      userId,
      username,
      amount,
      timestamp: new Date().toISOString(),
    };

    await pusherServer.trigger(
      `auction-${auctionId}`,
      'new-bid',
      { auctionId, bid }
    );

    console.log('Bid sent to Pusher');

    return NextResponse.json({ success: true, bid });
  } catch (error) {
    console.error('Pusher error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
