export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Only initialize Pusher if credentials are available
const getPusherServer = async () => {
  if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_SECRET) {
    console.log('Pusher not configured - real-time updates disabled');
    return null;
  }

  const Pusher = (await import('pusher')).default;
  return new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    useTLS: true,
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Bid received:', body);

    const { auctionId, userId, amount, username } = body;

    if (!auctionId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current auction
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { currentBid: true, startingPrice: true, status: true }
    });

    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    if (auction.status === 'ENDED' || auction.status === 'SOLD') {
      return NextResponse.json(
        { success: false, error: 'Auction has ended' },
        { status: 400 }
      );
    }

    const currentPrice = auction.currentBid || auction.startingPrice;
    if (amount <= currentPrice) {
      return NextResponse.json(
        { success: false, error: `Bid must be higher than $${currentPrice}` },
        { status: 400 }
      );
    }

    // Save bid to database
    const bid = await prisma.bid.create({
      data: {
        amount,
        userId: userId || 'anonymous',
        auctionId,
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    // Update auction current bid
    await prisma.auction.update({
      where: { id: auctionId },
      data: { currentBid: amount }
    });

    const bidResponse = {
      id: bid.id,
      auctionId,
      userId: bid.userId,
      username: username || bid.user?.username || 'Anonymous',
      amount: bid.amount,
      timestamp: bid.createdAt.toISOString(),
      time: 'just now',
    };

    // Send real-time update via Pusher if configured
    try {
      const pusherServer = await getPusherServer();
      if (pusherServer) {
        await pusherServer.trigger(
          `auction-${auctionId}`,
          'new-bid',
          { auctionId, bid: bidResponse }
        );
        console.log('Bid sent to Pusher');
      }
    } catch (pusherError) {
      console.error('Pusher notification failed:', pusherError);
      // Continue - bid was still saved
    }

    return NextResponse.json({ success: true, bid: bidResponse });
  } catch (error) {
    console.error('Bid error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
