export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// In production, verify webhook signature:
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // In production, verify the webhook signature:
    /*
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    */

    // Parse the event (in production, use verified event from above)
    const event = JSON.parse(body);

    switch (event.type) {
      case "checkout.session.completed": {
        // Payment successful - update transaction
        const session = event.data.object;
        const auctionId = session.metadata?.auctionId;

        if (auctionId) {
          await prisma.transaction.updateMany({
            where: { auctionId, status: "PENDING" },
            data: {
              status: "COMPLETED",
              stripePaymentId: session.payment_intent,
              updatedAt: new Date()
            }
          });

          // Update auction status
          await prisma.auction.update({
            where: { id: auctionId },
            data: { status: "SOLD" }
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        // Payment failed
        const paymentIntent = event.data.object;
        const auctionId = paymentIntent.metadata?.auctionId;

        if (auctionId) {
          await prisma.transaction.updateMany({
            where: { auctionId, status: "PENDING" },
            data: {
              status: "FAILED",
              updatedAt: new Date()
            }
          });
        }
        break;
      }

      case "account.updated": {
        // Stripe Connect account updated
        const account = event.data.object;

        // Find user with this Stripe account and update status if needed
        await prisma.user.updateMany({
          where: { stripeAccountId: account.id },
          data: { updatedAt: new Date() }
        });
        break;
      }

      case "payout.paid": {
        // Payout completed to seller
        const payout = event.data.object;
        const sellerId = payout.metadata?.sellerId;

        if (sellerId) {
          await prisma.sellerPayout.updateMany({
            where: { sellerId, status: "PROCESSING" },
            data: {
              status: "COMPLETED",
              stripePayoutId: payout.id,
              updatedAt: new Date()
            }
          });

          // Update seller balance
          const payoutAmount = payout.amount / 100; // Convert from cents
          await prisma.sellerProfile.update({
            where: { userId: sellerId },
            data: {
              pendingBalance: { decrement: payoutAmount },
              updatedAt: new Date()
            }
          });
        }
        break;
      }

      case "payout.failed": {
        // Payout failed
        const payout = event.data.object;
        const sellerId = payout.metadata?.sellerId;

        if (sellerId) {
          await prisma.sellerPayout.updateMany({
            where: { sellerId, status: "PROCESSING" },
            data: {
              status: "FAILED",
              updatedAt: new Date()
            }
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
