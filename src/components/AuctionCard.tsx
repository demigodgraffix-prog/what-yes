import React from 'react';
import { useAuctionTimer } from '../hooks/useAuctionTimer';
import { Auction } from '../types/auction';
import { formatCurrency } from '../utils/format';

interface AuctionCardProps {
  auction: Auction;
  onBid?: (auctionId: string) => void;
  onView?: (auctionId: string) => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction, onBid, onView }) => {
  const timer = useAuctionTimer(auction.endTime);

  return (
    <div className="group relative bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={auction.images[0] || '/placeholder.jpg'}
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {auction.status === 'active' && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            LIVE • {auction.bidCount} bids
          </div>
        )}

        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          🔥 {auction.bidCount} bids
        </div>

        <div className={`absolute bottom-2 left-2 text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm ${
          timer.isEnded
            ? 'bg-gray-800/70 text-gray-400'
            : timer.timeRemaining.includes('m') && parseInt(timer.timeRemaining) < 5
              ? 'bg-red-500/70 text-white animate-pulse'
              : 'bg-black/70 text-white'
        }`}>
          {timer.timeRemaining}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <button
            onClick={() => onView?.(auction.id)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300 hover:shadow-lg hover:shadow-purple-500/50"
          >
            View Auction
          </button>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-white font-medium truncate mb-1" title={auction.title}>
          {auction.title}
        </h3>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-xs">Current bid</p>
            <p className="text-white font-bold">
              {formatCurrency(auction.currentBid)}
            </p>
          </div>
          <button
            onClick={() => onBid?.(auction.id)}
            disabled={auction.status !== 'active'}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-purple-500/30 transition-all"
          >
            Bid
          </button>
        </div>
      </div>
    </div>
  );
};
