export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    console.log('Mux webhook received:', type, data?.id);

    switch (type) {
      case 'video.live_stream.active':
        // Stream is now active - update auction to LIVE
        await prisma.auction.updateMany({
          where: { streamId: data.id },
          data: { status: 'LIVE' }
        });
        console.log('Stream active, auction set to LIVE');
        break;

      case 'video.live_stream.idle':
        // Stream went idle - could mean stream ended
        console.log('Stream idle:', data.id);
        break;

      case 'video.live_stream.disconnected':
        // Stream disconnected
        console.log('Stream disconnected:', data.id);
        break;

      case 'video.asset.created':
        // Asset created from the stream recording
        if (data.passthrough) {
          await prisma.auction.update({
            where: { id: data.passthrough },
            data: { assetId: data.id }
          });
          console.log('Asset created for auction:', data.passthrough);
        }
        break;

      case 'video.asset.ready':
        // Asset ready for playback (recording available)
        const auction = await prisma.auction.findFirst({
          where: { assetId: data.id }
        });
        if (auction) {
          await prisma.auction.update({
            where: { id: auction.id },
            data: {
              playbackId: data.playback_ids?.[0]?.id
            }
          });
          console.log('Asset ready, playbackId updated');
        }
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
