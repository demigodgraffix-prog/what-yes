"use client";

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { sampleAuctions } from '@/data/sampleAuctions';
import { useAuctionStore } from '@/store/auctionStore';
import { Search, Menu, Bell, User, Sun, Moon, ChevronDown, Flame, Clock, TrendingUp, Crown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Generate products with stable viewer counts
const generateProducts = () => {
  const baseProducts = sampleAuctions.map((auction, i) => ({
    id: auction.id,
    image: auction.images[0],
    title: auction.title,
    currentBid: auction.currentBid,
    timeLeft: STATIC_TIMES[i % STATIC_TIMES.length],
    viewers: 50 + (i * 17) % 150,
    category: auction.category,
    isLive: auction.status === 'active',
    bidCount: auction.bidCount,
  }));

  const products = [];
  for (let i = 0; i < 4; i++) {
    products.push(...baseProducts.map((p, idx) => ({
      ...p,
      id: `${p.id}-${i}-${idx}`,
      viewers: 50 + ((i * 6 + idx) * 23) % 180,
    })));
  }
  return products;
};

// Static time values to avoid hydration mismatch
const STATIC_TIMES = ['2h', '1h', '30m', '1d', '4h', '1h'];

// Featured sellers data (Platinum & Gold tier)
const featuredSellers = [
  { id: '1', name: 'LuxuryWatches', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', tier: 'PLATINUM', sales: 520 },
  { id: '2', name: 'DesignerBags', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', tier: 'PLATINUM', sales: 485 },
  { id: '3', name: 'TechDeals', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', tier: 'GOLD', sales: 312 },
  { id: '4', name: 'CardKingdom', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', tier: 'GOLD', sales: 298 },
  { id: '5', name: 'SneakerVault', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100', tier: 'PLATINUM', sales: 445 },
  { id: '6', name: 'ArtCollector', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', tier: 'GOLD', sales: 267 },
  { id: '7', name: 'VintageFinds', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100', tier: 'GOLD', sales: 234 },
  { id: '8', name: 'RareGems', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100', tier: 'PLATINUM', sales: 512 },
];

// Promoted banner auction
const mockPromotedBanner = {
  id: '1',
  title: 'Vintage Rolex Submariner 16610 - Complete Set',
  seller: 'LuxuryWatches',
  image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400',
  currentBid: 8750,
};

export default function HomePage() {
  const { setAuctions, setLoading } = useAuctionStore();
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('trending');
  const [products] = useState(() => generateProducts());

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setAuctions(sampleAuctions);
      setLoading(false);
    }, 500);
  }, [setAuctions, setLoading]);

  const categories = ['All', 'Watches', 'Bags', 'Electronics', 'Collectibles', 'Art', 'Fashion', 'Sneakers', 'Sports', 'Toys'];

  const filters = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'ending', label: 'Ending Soon', icon: Clock },
    { id: 'hot', label: 'Hot Deals', icon: Flame },
  ];

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
        {/* Featured Sellers Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Featured Sellers
              <span className="text-xs text-gray-400 font-normal">Platinum & Gold Tier</span>
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
                      💎
                    </div>
                  )}
                  {seller.tier === "GOLD" && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center text-xs">
                      🥇
                    </div>
                  )}
                </div>
                <p className="text-white text-sm font-medium truncate">{seller.name}</p>
                <p className="text-gray-400 text-xs">{seller.sales}+ sales</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Promoted Auction Banner */}
        {mockPromotedBanner && (
          <div className="mb-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-4 border border-purple-500/30">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={mockPromotedBanner.image}
                  alt={mockPromotedBanner.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-purple-400 text-xs font-semibold">✨ PROMOTED AUCTION</span>
                <h3 className="text-white font-bold truncate">{mockPromotedBanner.title}</h3>
                <p className="text-gray-400 text-sm">by {mockPromotedBanner.seller}</p>
                <p className="text-green-400 text-sm font-bold mt-1">Current Bid: ${mockPromotedBanner.currentBid.toLocaleString()}</p>
              </div>
              <Link
                href={`/auction/${mockPromotedBanner.id}`}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm whitespace-nowrap flex-shrink-0"
              >
                View Auction
              </Link>
            </div>
          </div>
        )}

        {/* Auctions Grid */}
        {filteredProducts.length > 0 ? (
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
                    window.location.href = `/auction/${product.id.split('-')[0]}`;
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
              No auctions found matching your criteria.
            </p>
          </div>
        )}
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
