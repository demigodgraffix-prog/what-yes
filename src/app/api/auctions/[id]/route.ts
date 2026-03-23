export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        seller: true,
        images: {
          orderBy: { order: 'asc' }
        },
        bids: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: true }
        }
      }
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    // Format the response
    const formattedAuction = {
      id: auction.id,
      title: auction.title,
      description: auction.description,
      images: auction.images.map((img: { url: string }) => img.url),
      currentBid: auction.currentBid || auction.startingPrice,
      startingPrice: auction.startingPrice,
      buyNowPrice: auction.buyNowPrice,
      reservePrice: auction.reservePrice,
      status: auction.status,
      playbackId: auction.playbackId,
      streamId: auction.streamId,
      seller: {
        id: auction.seller.id,
        username: auction.seller.username,
        avatar: auction.seller.avatar,
        rating: 4.9,
        sales: 0
      },
      bids: auction.bids.map((bid: { id: string; user: { username: string }; userId: string; amount: number; createdAt: Date }) => ({
        id: bid.id,
        username: bid.user.username,
        userId: bid.userId,
        amount: bid.amount,
        timestamp: bid.createdAt,
        time: getTimeAgo(bid.createdAt)
      })),
      createdAt: auction.createdAt,
      startTime: auction.startTime,
      endTime: auction.endTime
    };

    return NextResponse.json({ auction: formattedAuction });
  } catch (error) {
    console.error("Get auction error:", error);
    return NextResponse.json({ error: "Failed to fetch auction" }, { status: 500 });
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
