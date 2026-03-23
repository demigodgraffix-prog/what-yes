"use client";

import MuxPlayerReact from "@mux/mux-player-react";

interface MuxPlayerProps {
  playbackId: string;
  isLive?: boolean;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
}

export function MuxPlayer({
  playbackId,
  isLive = false,
  title,
  className = "",
  autoPlay = true,
  muted = true,
}: MuxPlayerProps) {
  return (
    <MuxPlayerReact
      playbackId={playbackId}
      streamType={isLive ? "live" : "on-demand"}
      autoPlay={autoPlay}
      muted={muted}
      title={title}
      className={className}
      style={{ aspectRatio: "16/9", width: "100%" }}
      primaryColor="#ef4444"
      secondaryColor="#ffffff"
      accentColor="#ef4444"
    />
  );
}

export default MuxPlayer;
