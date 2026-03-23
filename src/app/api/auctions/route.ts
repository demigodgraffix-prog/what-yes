export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { sellerId, title, description, startingPrice, buyNowPrice, reservePrice, duration, startTime } = await req.json();

    if (!sellerId || !title || !startingPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const auction = await prisma.auction.create({
      data: {
        sellerId,
        title,
        description: description || null,
        startingPrice: parseFloat(startingPrice),
        currentBid: 0,
        buyNowPrice: buyNowPrice ? parseFloat(buyNowPrice) : null,
        reservePrice: reservePrice ? parseFloat(reservePrice) : null,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: new Date(Date.now() + (duration || 24) * 60 * 60 * 1000),
        status: "SCHEDULED",
      },
      include: {
        seller: true,
        images: true,
      }
    });

    return NextResponse.json({ auction });
  } catch (error) {
    console.error("Create auction error:", error);
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "24");
    const sellerId = searchParams.get("sellerId");

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (sellerId) {
      whereClause.sellerId = sellerId;
    }

    const auctions = await prisma.auction.findMany({
      where: whereClause,
      include: {
        seller: true,
        images: true,
        bids: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { user: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const totalLive = await prisma.auction.count({ where: { status: "LIVE" } });

    return NextResponse.json({
      auctions,
      stats: {
        live: totalLive,
        watching: 0 // Viewer count would need real-time tracking
      }
    });
  } catch (error) {
    console.error("Get auctions error:", error);
    return NextResponse.json({ error: "Failed to get auctions" }, { status: 500 });
  }
}
