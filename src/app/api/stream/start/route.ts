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

    if (!auctionId || !sellerId) {
      return NextResponse.json(
        { error: "Missing auctionId or sellerId" },
        { status: 400 }
      );
    }

    // Verify the auction exists and belongs to the seller
    const auction = await prisma.auction.findFirst({
      where: {
        id: auctionId,
        sellerId: sellerId,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if already streaming
    if (auction.streamId && auction.status === 'LIVE') {
      return NextResponse.json(
        { error: "Stream is already active" },
        { status: 400 }
      );
    }

    // Create a new Mux live stream
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: ["public"],
      new_asset_settings: {
        playback_policy: ["public"],
      },
      latency_mode: "low",
      reconnect_window: 60,
    });

    // Update the auction with stream details
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        streamId: liveStream.id,
        streamKey: liveStream.stream_key,
        rtmpUrl: "rtmps://global-live.mux.com:443/app",
        playbackId: liveStream.playback_ids?.[0]?.id,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json({
      success: true,
      streamKey: liveStream.stream_key,
      streamUrl: "rtmps://global-live.mux.com:443/app",
      playbackId: liveStream.playback_ids?.[0]?.id,
      streamId: liveStream.id,
    });
  } catch (error) {
    console.error("Start stream error:", error);
    return NextResponse.json(
      { error: "Failed to start stream" },
      { status: 500 }
    );
  }
}
