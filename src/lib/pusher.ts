import Pusher from 'pusher-js';

// Enable logging in development
if (process.env.NODE_ENV === 'development') {
  Pusher.logToConsole = true;
}

// Create Pusher client instance
export const pusherClient = new Pusher(
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY || 'e29f0d444eacc411c59c',
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  }
);

// Channel names
export const CHANNELS = {
  AUCTIONS: 'auctions',
  AUCTION: (id: string) => `auction-${id}`,
} as const;

// Event names
export const EVENTS = {
  NEW_BID: 'new-bid',
  OUTBID: 'outbid',
  AUCTION_ENDED: 'auction-ended',
  AUCTION_UPDATED: 'auction-updated',
} as const;
