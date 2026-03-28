import { prisma } from "./prisma";

// ==================== USER FUNCTIONS ====================

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      sellerProfile: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function updateUserRole(userId: string, role: "BUYER" | "SELLER" | "ADMIN") {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function getUserStats(userId: string) {
  const [auctions, bids, profile] = await Promise.all([
    prisma.auction.count({ where: { sellerId: userId } }),
    prisma.bid.count({ where: { userId } }),
    prisma.sellerProfile.findUnique({ where: { userId } }),
  ]);

  return {
    totalAuctions: auctions,
    totalBids: bids,
    lifetimeSales: profile?.lifetimeSales || 0,
    lifetimeRevenue: profile?.lifetimeRevenue || 0,
    rating: profile?.rating || 0,
  };
}

// ==================== AUCTION FUNCTIONS ====================

export async function getActiveAuctions(limit = 24) {
  return prisma.auction.findMany({
    where: {
      status: { in: ["LIVE", "SCHEDULED"] },
      endTime: { gt: new Date() },
    },
    include: {
      seller: true,
      images: true,
      bids: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAuctionById(auctionId: string) {
  return prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      seller: true,
      images: { orderBy: { order: "asc" } },
      bids: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

export async function getSellerAuctions(sellerId: string) {
  return prisma.auction.findMany({
    where: { sellerId },
    include: {
      images: true,
      bids: {
        orderBy: { amount: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateAuctionStatus(
  auctionId: string,
  status: "SCHEDULED" | "LIVE" | "ENDED" | "SOLD" | "CANCELLED"
) {
  return prisma.auction.update({
    where: { id: auctionId },
    data: { status },
  });
}

// ==================== BID FUNCTIONS ====================

export async function placeBid(auctionId: string, userId: string, amount: number) {
  // Get current auction state
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { currentBid: true, startingPrice: true, status: true, endTime: true },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }

  if (auction.status !== "LIVE" && auction.status !== "SCHEDULED") {
    throw new Error("Auction is not active");
  }

  if (new Date() > auction.endTime) {
    throw new Error("Auction has ended");
  }

  const currentPrice = auction.currentBid || auction.startingPrice;
  if (amount <= currentPrice) {
    throw new Error(`Bid must be higher than ${currentPrice}`);
  }

  // Create bid and update auction in transaction
  const [bid] = await prisma.$transaction([
    prisma.bid.create({
      data: {
        amount,
        userId,
        auctionId,
      },
      include: {
        user: {
          select: { username: true },
        },
      },
    }),
    prisma.auction.update({
      where: { id: auctionId },
      data: { currentBid: amount },
    }),
  ]);

  return bid;
}

export async function getBidHistory(auctionId: string, limit = 50) {
  return prisma.bid.findMany({
    where: { auctionId },
    include: {
      user: {
        select: { id: true, username: true, avatar: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ==================== TRANSACTION FUNCTIONS ====================

export async function createTransaction(data: {
  auctionId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  platformFee: number;
  processingFee: number;
  sellerPayout: number;
}) {
  return prisma.transaction.create({
    data: {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      status: "PENDING",
    },
  });
}

export async function getRecentTransactions(limit = 20) {
  return prisma.transaction.findMany({
    include: {
      auction: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function updateTransactionStatus(
  transactionId: string,
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "DISPUTED",
  stripePaymentId?: string
) {
  return prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status,
      stripePaymentId,
      updatedAt: new Date(),
    },
  });
}

// ==================== PLATFORM STATS ====================

export async function getPlatformStats() {
  const [
    totalUsers,
    totalSellers,
    totalAuctions,
    activeAuctions,
    completedSales,
    transactions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.auction.count(),
    prisma.auction.count({ where: { status: "LIVE" } }),
    prisma.auction.count({ where: { status: "SOLD" } }),
    prisma.transaction.aggregate({
      _sum: { amount: true, platformFee: true },
      where: { status: "COMPLETED" },
    }),
  ]);

  return {
    totalUsers,
    totalSellers,
    totalBuyers: totalUsers - totalSellers,
    totalAuctions,
    activeAuctions,
    completedSales,
    totalRevenue: transactions._sum.amount || 0,
    platformFees: transactions._sum.platformFee || 0,
  };
}

export async function getSellerStats(sellerId: string) {
  const [profile, auctions, transactions] = await Promise.all([
    prisma.sellerProfile.findUnique({ where: { userId: sellerId } }),
    prisma.auction.findMany({
      where: { sellerId },
      select: { status: true, currentBid: true },
    }),
    prisma.transaction.aggregate({
      _sum: { sellerPayout: true },
      _count: true,
      where: { sellerId, status: "COMPLETED" },
    }),
  ]);

  const activeCount = auctions.filter((a) => a.status === "LIVE").length;
  const completedCount = auctions.filter((a) => a.status === "SOLD").length;

  return {
    lifetimeSales: profile?.lifetimeSales || transactions._count || 0,
    lifetimeRevenue: profile?.lifetimeRevenue || transactions._sum.sellerPayout || 0,
    pendingBalance: profile?.pendingBalance || 0,
    availableBalance: profile?.availableBalance || 0,
    activeAuctions: activeCount,
    completedAuctions: completedCount,
    rating: profile?.rating || 0,
  };
}

// ==================== FEATURED SELLERS ====================

export async function getFeaturedSellers(limit = 10) {
  const sellers = await prisma.user.findMany({
    where: {
      role: "SELLER",
      sellerProfile: {
        lifetimeSales: { gt: 0 },
      },
    },
    include: {
      sellerProfile: true,
    },
    orderBy: {
      sellerProfile: {
        lifetimeSales: "desc",
      },
    },
    take: limit,
  });

  return sellers.map((seller) => ({
    id: seller.id,
    name: seller.username,
    avatar: seller.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${seller.username}`,
    tier: getTier(seller.sellerProfile?.lifetimeSales || 0),
    sales: seller.sellerProfile?.lifetimeSales || 0,
    rating: seller.sellerProfile?.rating || 0,
  }));
}

function getTier(sales: number): "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" {
  if (sales >= 100) return "PLATINUM";
  if (sales >= 50) return "GOLD";
  if (sales >= 20) return "SILVER";
  return "BRONZE";
}
