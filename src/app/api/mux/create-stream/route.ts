export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { auctionId } = await request.json();

    if (!auctionId) {
      return NextResponse.json(
        { error: 'Missing auctionId' },
        { status: 400 }
      );
    }

    // Verify auction exists
    const existingAuction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!existingAuction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Check if Mux is configured
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      // Return demo stream details for testing
      const demoStreamKey = `demo_${auctionId}_${Date.now()}`;
      const demoPlaybackId = `demo_${auctionId}`;

      await prisma.auction.update({
        where: { id: auctionId },
        data: {
          streamKey: demoStreamKey,
          rtmpUrl: 'rtmps://global-live.mux.com:443/app',
          playbackId: demoPlaybackId,
          status: 'LIVE', // Set to live for demo
        }
      });

      return NextResponse.json({
        streamKey: demoStreamKey,
        rtmpUrl: 'rtmps://global-live.mux.com:443/app',
        streamId: `demo_stream_${auctionId}`,
        playbackId: demoPlaybackId,
        isDemo: true,
        message: 'Demo mode: Add MUX_TOKEN_ID and MUX_TOKEN_SECRET for real streaming',
      });
    }

    // Create a live stream with Mux
    const Mux = (await import('@mux/mux-node')).default;
    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });

    const liveStream = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: {
        playback_policy: ['public'],
        mp4_support: 'standard',
      },
      latency_mode: 'low',
      reconnect_window: 60,
      passthrough: auctionId,
    });

    // Store stream details in database
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        streamId: liveStream.id,
        streamKey: liveStream.stream_key,
        rtmpUrl: 'rtmps://global-live.mux.com:443/app',
        playbackId: liveStream.playback_ids?.[0]?.id,
        status: 'LIVE',
      }
    });

    return NextResponse.json({
      streamKey: liveStream.stream_key,
      rtmpUrl: 'rtmps://global-live.mux.com:443/app',
      streamId: liveStream.id,
      playbackId: liveStream.playback_ids?.[0]?.id,
    });
  } catch (error) {
    console.error('Mux error:', error);
    return NextResponse.json(
      { error: 'Failed to create stream', details: String(error) },
      { status: 500 }
    );
  }
}
