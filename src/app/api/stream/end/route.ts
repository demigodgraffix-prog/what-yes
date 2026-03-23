export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { auctionId, sellerId } = await req.json();

    if (!auctionId) {
      return NextResponse.json(
        { error: "Missing auctionId" },
        { status: 400 }
      );
    }

    // Find the auction
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    // Optional: verify seller ownership
    if (sellerId && auction.sellerId !== sellerId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (!auction.streamId) {
      return NextResponse.json(
        { error: "No active stream found" },
        { status: 400 }
      );
    }

    // Disable the live stream
    try {
      await mux.video.liveStreams.disable(auction.streamId);
    } catch (muxError) {
      console.error("Mux disable error:", muxError);
    }

    // Update the auction status
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: "ENDED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Stream ended successfully",
    });
  } catch (error) {
    console.error("End stream error:", error);
    return NextResponse.json(
      { error: "Failed to end stream" },
      { status: 500 }
    );
  }
}
