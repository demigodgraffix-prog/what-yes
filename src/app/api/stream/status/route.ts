export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const auctionId = searchParams.get("auctionId");

    if (!auctionId) {
      return NextResponse.json(
        { error: "Missing auctionId" },
        { status: 400 }
      );
    }

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        streamId: true,
        playbackId: true,
        streamKey: true,
        rtmpUrl: true,
        status: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    // If there's a live stream, get its status from Mux
    let muxStatus = null;
    if (auction.streamId) {
      try {
        const liveStream = await mux.video.liveStreams.retrieve(auction.streamId);
        muxStatus = {
          status: liveStream.status,
          activeAssetId: liveStream.active_asset_id,
          recentAssetIds: liveStream.recent_asset_ids,
        };
      } catch (error) {
        console.error("Failed to get Mux stream status:", error);
      }
    }

    return NextResponse.json({
      isLive: auction.status === 'LIVE',
      status: auction.status,
      playbackId: auction.playbackId,
      hasStreamKey: !!auction.streamKey,
      muxStatus,
    });
  } catch (error) {
    console.error("Stream status error:", error);
    return NextResponse.json(
      { error: "Failed to get stream status" },
      { status: 500 }
    );
  }
}
