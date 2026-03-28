export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get seller profiles with user data, ordered by sales
    const sellerProfiles = await prisma.sellerProfile.findMany({
      where: {
        lifetimeSales: { gt: 0 }
      },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            avatar: true,
          }
        }
      },
      orderBy: [
        { lifetimeRevenue: 'desc' },
        { lifetimeSales: 'desc' }
      ],
      take: 12
    });

    // Transform to featured sellers format with tier calculation
    const featuredSellers = sellerProfiles.map(profile => {
      // Calculate tier based on lifetime sales
      let tier = 'BRONZE';
      if (profile.lifetimeSales >= 500) {
        tier = 'PLATINUM';
      } else if (profile.lifetimeSales >= 250) {
        tier = 'GOLD';
      } else if (profile.lifetimeSales >= 100) {
        tier = 'SILVER';
      }

      return {
        id: profile.User.id,
        name: profile.User.username,
        avatar: profile.User.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.User.username}`,
        tier,
        sales: profile.lifetimeSales,
        rating: profile.rating,
      };
    });

    // If no sellers in DB yet, return empty array (no demo data)
    return NextResponse.json({
      sellers: featuredSellers,
      total: featuredSellers.length
    });
  } catch (error) {
    console.error("Get featured sellers error:", error);
    return NextResponse.json({
      sellers: [],
      total: 0,
      error: "Failed to fetch featured sellers"
    }, { status: 500 });
  }
}
