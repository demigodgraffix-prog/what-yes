import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==================== REAL-TIME SUBSCRIPTIONS ====================

// Store active channels
const activeChannels: Map<string, RealtimeChannel> = new Map();

/**
 * Subscribe to new bids on an auction
 */
export function subscribeToAuctionBids(
  auctionId: string,
  onBid: (bid: { amount: number; userId: string; createdAt: string }) => void
) {
  const channelName = `auction-bids-${auctionId}`;

  // Unsubscribe from existing channel if any
  const existingChannel = activeChannels.get(channelName);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'Bid',
        filter: `auctionId=eq.${auctionId}`,
      },
      (payload) => {
        onBid(payload.new as { amount: number; userId: string; createdAt: string });
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  return () => {
    supabase.removeChannel(channel);
    activeChannels.delete(channelName);
  };
}

/**
 * Subscribe to auction status changes
 */
export function subscribeToAuctionStatus(
  auctionId: string,
  onStatusChange: (status: string) => void
) {
  const channelName = `auction-status-${auctionId}`;

  const existingChannel = activeChannels.get(channelName);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'Auction',
        filter: `id=eq.${auctionId}`,
      },
      (payload) => {
        const newStatus = (payload.new as { status: string }).status;
        onStatusChange(newStatus);
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  return () => {
    supabase.removeChannel(channel);
    activeChannels.delete(channelName);
  };
}

/**
 * Subscribe to all new auctions
 */
export function subscribeToNewAuctions(
  onNewAuction: (auction: { id: string; title: string; status: string }) => void
) {
  const channelName = 'new-auctions';

  const existingChannel = activeChannels.get(channelName);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'Auction',
      },
      (payload) => {
        onNewAuction(payload.new as { id: string; title: string; status: string });
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  return () => {
    supabase.removeChannel(channel);
    activeChannels.delete(channelName);
  };
}

/**
 * Unsubscribe from all channels
 */
export function unsubscribeAll() {
  activeChannels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  activeChannels.clear();
}

// ==================== TYPES ====================

export interface SellerApplication {
  id: string;
  user_id: string;
  full_legal_name: string;
  date_of_birth: string;
  address: string;
  ssn_last_4: string;
  drivers_license_front_url: string | null;
  drivers_license_back_url: string | null;
  selfie_holding_id_url: string | null;
  business_name: string | null;
  tax_id_ein: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface AgreementSigned {
  id: string;
  user_id: string;
  agreement_type: 'seller_terms' | 'buyer_terms' | 'privacy_policy' | 'community_guidelines';
  version: string;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface FlaggedContent {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_show_id: string | null;
  reported_item_id: string | null;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}
