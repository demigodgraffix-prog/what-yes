"use client";

import { useState } from "react";
import { Video, Copy, Check, ExternalLink } from "lucide-react";

interface GoLiveButtonProps {
  auctionId: string;
  sellerId: string;
  isLive: boolean;
  streamKey?: string;
  streamUrl?: string;
}

export function GoLiveButton({ auctionId, sellerId, isLive, streamKey, streamUrl }: GoLiveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [streamDetails, setStreamDetails] = useState<{
    streamKey: string;
    streamUrl: string;
    playbackId: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generateStreamKey = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId, sellerId }),
      });
      const data = await response.json();
      setStreamDetails(data);
    } catch (error) {
      console.error("Failed to generate stream key:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLive) {
    return (
      <div className="bg-green-600/20 rounded-lg p-4 border border-green-500/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-400 font-semibold">LIVE NOW</span>
        </div>
        <p className="text-gray-300 text-sm">Your stream is live!</p>
        <a
          href={`/auction/${auctionId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
        >
          View Auction Page <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  if (streamDetails) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-600/10 rounded-lg p-4 border border-blue-500/30">
          <h4 className="text-white font-semibold mb-3">Stream Setup Instructions</h4>

          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Stream URL</label>
              <div className="flex gap-2">
                <code className="flex-1 bg-black/40 rounded-lg p-2 text-sm text-blue-400 font-mono break-all">
                  {streamDetails.streamUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(streamDetails.streamUrl, "url")}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {copied === "url" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Stream Key</label>
              <div className="flex gap-2">
                <code className="flex-1 bg-black/40 rounded-lg p-2 text-sm text-blue-400 font-mono">
                  {streamDetails.streamKey}
                </code>
                <button
                  onClick={() => copyToClipboard(streamDetails.streamKey, "key")}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {copied === "key" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-600/10 rounded-lg">
            <p className="text-yellow-400 text-xs">
              Use these credentials in OBS Studio, Streamlabs, or any RTMP-compatible streaming software.
              Once you start streaming, your auction will automatically go live!
            </p>
          </div>

          <a
            href={`/auction/${auctionId}`}
            className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-center inline-block hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Preview Auction Page
          </a>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={generateStreamKey}
      disabled={loading}
      className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
    >
      <Video className="w-5 h-5" />
      {loading ? "Generating Stream Key..." : "Go Live"}
    </button>
  );
}
