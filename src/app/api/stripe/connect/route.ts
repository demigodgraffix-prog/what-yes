export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Note: In production, you would use the Stripe SDK:
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { userId, returnUrl: _returnUrl } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Check if user exists and is a seller
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, stripeAccountId: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "SELLER") {
      return NextResponse.json({ error: "User must be an approved seller" }, { status: 403 });
    }

    // If user already has Stripe account, return dashboard link
    if (user.stripeAccountId) {
      // In production: Create login link to Stripe Express dashboard
      // const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);
      return NextResponse.json({
        type: "login",
        url: `https://dashboard.stripe.com/express/${user.stripeAccountId}`,
        message: "Stripe account already connected"
      });
    }

    // In production, create Stripe Connect account:
    /*
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    });

    // Save Stripe account ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId: account.id }
    });

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: `${returnUrl}?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      type: "onboarding",
      url: accountLink.url,
      accountId: account.id
    });
    */

    // Placeholder response until Stripe is configured
    return NextResponse.json({
      type: "setup_required",
      message: "Stripe Connect requires STRIPE_SECRET_KEY environment variable",
      setup_instructions: {
        step1: "Create a Stripe account at https://stripe.com",
        step2: "Enable Connect in your Stripe dashboard",
        step3: "Add STRIPE_SECRET_KEY to your environment variables",
        step4: "Add STRIPE_WEBHOOK_SECRET for webhook verification"
      }
    });

  } catch (error) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json({ error: "Failed to create Stripe connection" }, { status: 500 });
  }
}

// GET: Check Stripe connection status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeAccountId: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      connected: !!user.stripeAccountId,
      accountId: user.stripeAccountId,
      canReceivePayouts: user.role === "SELLER" && !!user.stripeAccountId
    });

  } catch (error) {
    console.error("Stripe status error:", error);
    return NextResponse.json({ error: "Failed to check Stripe status" }, { status: 500 });
  }
}
