export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSocket } from "@/lib/socket";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, amount } = await req.json();
    const { id: auctionId } = await params;

    if (!userId || !amount) {
      return NextResponse.json({ error: "Missing userId or amount" }, { status: 400 });
    }

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { bids: true, seller: true }
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (auction.status !== "LIVE") {
      return NextResponse.json({ error: "Auction is not live" }, { status: 400 });
    }

    const currentBid = auction.currentBid || auction.startingPrice;
    if (amount <= currentBid) {
      return NextResponse.json({ error: "Bid must be higher than current bid" }, { status: 400 });
    }

    const bid = await prisma.bid.create({
      data: {
        amount,
        userId,
        auctionId,
      },
      include: { user: true }
    });

    await prisma.auction.update({
      where: { id: auctionId },
      data: { currentBid: amount }
    });

    // Emit via Socket.IO
    try {
      const socket = getSocket();
      socket?.to(`auction-${auctionId}`).emit("new-bid", {
        auctionId,
        bid: {
          id: bid.id,
          amount: bid.amount,
          username: bid.user.username,
          userId: bid.user.id,
          timestamp: bid.createdAt
        }
      });
    } catch (socketError) {
      console.error("Socket emit error:", socketError);
    }

    return NextResponse.json({ bid });
  } catch (error) {
    console.error("Place bid error:", error);
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}
