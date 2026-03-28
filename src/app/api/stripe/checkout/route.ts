export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Platform fee percentage (8%)
const PLATFORM_FEE_PERCENT = 8;
// Stripe processing fee (2.9% + $0.30)
const STRIPE_FEE_PERCENT = 2.9;
const STRIPE_FEE_FIXED = 0.30;

export async function POST(request: NextRequest) {
  try {
    const { auctionId, buyerId } = await request.json();

    if (!auctionId || !buyerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get auction with seller info
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        seller: {
          select: { id: true, stripeAccountId: true }
        }
      }
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (auction.status !== "ENDED" && auction.status !== "SOLD") {
      return NextResponse.json({ error: "Auction not ready for payment" }, { status: 400 });
    }

    // Check seller has Stripe connected
    if (!auction.seller.stripeAccountId) {
      return NextResponse.json({
        error: "Seller has not connected Stripe yet",
        sellerNeedsStripe: true
      }, { status: 400 });
    }

    // Calculate fees
    const amount = auction.currentBid || auction.startingPrice;
    const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
    const processingFee = Math.round((amount * (STRIPE_FEE_PERCENT / 100) + STRIPE_FEE_FIXED) * 100) / 100;
    const sellerPayout = Math.round((amount - platformFee - processingFee) * 100) / 100;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        auctionId,
        buyerId,
        sellerId: auction.sellerId,
        amount,
        platformFee,
        processingFee,
        sellerPayout,
        status: "PENDING",
        updatedAt: new Date()
      }
    });

    // In production, create Stripe Checkout session:
    /*
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: auction.title,
            images: auction.images?.map(img => img.url) || [],
          },
          unit_amount: Math.round(amount * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: Math.round((platformFee + processingFee) * 100),
        transfer_data: {
          destination: auction.seller.stripeAccountId,
        },
        metadata: {
          auctionId,
          buyerId,
          transactionId: transaction.id,
        },
      },
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auction/${auctionId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auction/${auctionId}?payment=cancelled`,
      metadata: {
        auctionId,
        buyerId,
        transactionId: transaction.id,
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      transactionId: transaction.id
    });
    */

    // Placeholder until Stripe is configured
    return NextResponse.json({
      message: "Stripe checkout requires configuration",
      transactionId: transaction.id,
      breakdown: {
        itemPrice: amount,
        platformFee,
        processingFee,
        sellerReceives: sellerPayout,
        total: amount
      },
      setup_required: true
    });

  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
