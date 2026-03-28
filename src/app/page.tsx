"use client";

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Search, Menu, Bell, User, Sun, Moon, Flame, Clock, TrendingUp, Crown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Static time helper
function getTimeLeft(endTime: string): string {
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) return `${Math.floor(hours / 24)}d`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

interface FeaturedSeller {
  id: string;
  name: string;
  avatar: string;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  sales: number;
  rating: number;
}

interface AuctionData {
  id: string;
  title: string;
  description?: string;
  startingPrice: number;
  currentBid: number;
  status: string;
  endTime: string;
  images: { url: string }[];
  seller: { id: string; username: string };
  bids: { amount: number }[];
}

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('trending');
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [featuredSellers, setFeaturedSellers] = useState<FeaturedSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [promotedAuction, setPromotedAuction] = useState<AuctionData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch auctions and featured sellers in parallel
        const [auctionsRes, sellersRes] = await Promise.all([
          fetch('/api/auctions'),
          fetch('/api/sellers/featured')
        ]);

        const auctionsData = await auctionsRes.json();
        const sellersData = await sellersRes.json();

        setAuctions(auctionsData.auctions || []);
        setFeaturedSellers(sellersData.sellers || []);

        // Set first active auction as promoted if exists
        const activeAuctions = (auctionsData.auctions || []).filter(
          (a: AuctionData) => a.status === 'LIVE' || a.status === 'SCHEDULED'
        );
        if (activeAuctions.length > 0) {
          setPromotedAuction(activeAuctions[0]);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const categories = ['All', 'Watches', 'Bags', 'Electronics', 'Collectibles', 'Art', 'Fashion', 'Sneakers', 'Sports', 'Toys'];

  const filters = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'ending', label: 'Ending Soon', icon: Clock },
    { id: 'hot', label: 'Hot Deals', icon: Flame },
  ];

  // Transform auctions to product format
  const products = auctions.map((auction, i) => ({
    id: auction.id,
    image: auction.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    title: auction.title,
    currentBid: auction.currentBid || auction.startingPrice,
    timeLeft: getTimeLeft(auction.endTime),
    viewers: 50 + (i * 17) % 150,
    category: 'All',
    isLive: auction.status === 'LIVE',
    bidCount: auction.bids?.length || 0,
  }));

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5' : 'bg-white/95 backdrop-blur-md border-b border-gray-200'}`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <button className="lg:hidden p-1">
                <Menu className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
              </button>
              <Link href="/">
                <h1 className="text-xl font-black tracking-tight">
                  <span className="text-white">WHAT</span>
                  <span className="text-purple-500">YES</span>
                </h1>
              </Link>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search live auctions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-sm rounded-full ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                      : 'bg-gray-100 border-gray-200 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all`}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
                <Bell className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Link href="/profile">
                <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
                  <User className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
                </button>
              </Link>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-gray-900" />}
              </button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : darkMode
                      ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className={`px-4 py-3 border-b ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="flex items-center gap-4">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  selectedFilter === filter.id
                    ? 'text-purple-500'
                    : darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {filteredProducts.length} auctions
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4">
        {/* Featured Sellers Section - Only show if there are featured sellers */}
        {featuredSellers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Featured Sellers
                <span className="text-xs text-gray-400 font-normal">Top Performers</span>
              </h2>
              <Link href="/sellers" className="text-purple-400 text-sm hover:text-purple-300">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {featuredSellers.map((seller) => (
                <Link
                  key={seller.id}
                  href={`/seller/${seller.id}`}
                  className="bg-[#1A1A1A]/80 rounded-lg p-3 text-center hover:ring-2 hover:ring-purple-500/50 transition-all"
                >
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <Image
                      src={seller.avatar}
                      alt={seller.name}
                      fill
                      className="rounded-full object-cover"
                      unoptimized
                    />
                    {seller.tier === "PLATINUM" && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xs">
                        P
                      </div>
                    )}
                    {seller.tier === "GOLD" && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center text-xs">
                        G
                      </div>
                    )}
                  </div>
                  <p className="text-white text-sm font-medium truncate">{seller.name}</p>
                  <p className="text-gray-400 text-xs">{seller.sales}+ sales</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Promoted Auction Banner - Only show if there's a promoted auction */}
        {promotedAuction && (
          <div className="mb-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-4 border border-purple-500/30">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={promotedAuction.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                  alt={promotedAuction.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-purple-400 text-xs font-semibold">
                  {promotedAuction.status === 'LIVE' ? '🔴 LIVE NOW' : '✨ FEATURED AUCTION'}
                </span>
                <h3 className="text-white font-bold truncate">{promotedAuction.title}</h3>
                <p className="text-gray-400 text-sm">by {promotedAuction.seller?.username || 'Seller'}</p>
                <p className="text-green-400 text-sm font-bold mt-1">
                  Current Bid: ${(promotedAuction.currentBid || promotedAuction.startingPrice).toLocaleString()}
                </p>
              </div>
              <Link
                href={`/auction/${promotedAuction.id}`}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm whitespace-nowrap flex-shrink-0"
              >
                View Auction
              </Link>
            </div>
          </div>
        )}

        {/* Empty State for New Platform */}
        {!isLoading && filteredProducts.length === 0 && featuredSellers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Welcome to WHAT-YES!</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              The live auction marketplace is ready. Be one of the first sellers to go live!
            </p>
            <Link
              href="/apply-to-sell"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold"
            >
              Apply to Become a Seller
            </Link>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Loading auctions...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          /* Auctions Grid */
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            }}
          >
            {filteredProducts.map((product) => (
              <div key={product.id} className="flex justify-center">
                <ProductCard
                  {...product}
                  onClick={() => {
                    window.location.href = `/auction/${product.id}`;
                  }}
                />
              </div>
            ))}
          </div>
        ) : featuredSellers.length > 0 ? (
          <div className="text-center py-16">
            <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
              No live auctions right now. Check back soon or follow a seller to get notified!
            </p>
          </div>
        ) : null}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/5' : 'bg-white/95 backdrop-blur-md border-t border-gray-200'} lg:hidden z-50`}>
        <div className="flex justify-around py-2">
          {[
            { label: 'Home', href: '/', active: true },
            { label: 'Search', href: '/search', active: false },
            { label: 'Sell', href: '/sell', active: false },
            { label: 'Activity', href: '/activity', active: false },
            { label: 'Profile', href: '/profile', active: false },
          ].map((item) => (
            <Link href={item.href} key={item.label}>
              <button className="flex flex-col items-center gap-0.5 px-3 py-1">
                <div className={`w-1 h-1 rounded-full ${item.active ? 'bg-purple-500' : 'bg-transparent'}`} />
                <span className={`text-[10px] font-medium ${item.active ? 'text-purple-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </button>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom Spacing for Nav */}
      <div className="h-14 lg:hidden" />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
