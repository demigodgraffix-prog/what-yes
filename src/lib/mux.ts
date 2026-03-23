import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export const createLiveStream = async () => {
  try {
    const stream = await mux.video.liveStreams.create({
      playback_policy: ["public"],
      new_asset_settings: {
        playback_policy: ["public"],
        mp4_support: "standard",
      },
      latency_mode: "low",
    });

    return {
      streamKey: stream.stream_key,
      streamUrl: `rtmps://global-live.mux.com:443/app/${stream.stream_key}`,
      playbackId: stream.playback_ids?.[0]?.id,
      liveStreamId: stream.id,
    };
  } catch (error) {
    console.error("Failed to create live stream:", error);
    throw error;
  }
};

export const endLiveStream = async (liveStreamId: string) => {
  try {
    await mux.video.liveStreams.disable(liveStreamId);
    return { success: true };
  } catch (error) {
    console.error("Failed to end live stream:", error);
    throw error;
  }
};

export const getAssetInfo = async (assetId: string) => {
  try {
    const asset = await mux.video.assets.retrieve(assetId);
    return {
      playbackId: asset.playback_ids?.[0]?.id,
      status: asset.status,
      duration: asset.duration,
      mp4Support: asset.mp4_support,
    };
  } catch (error) {
    console.error("Failed to get asset info:", error);
    throw error;
  }
};

export const createAssetFromLiveStream = async (liveStreamId: string) => {
  try {
    const asset = await mux.video.assets.create({
      inputs: [{ url: `mux://${liveStreamId}` }],
      playback_policy: ["public"],
      mp4_support: "standard",
    });

    return {
      assetId: asset.id,
      playbackId: asset.playback_ids?.[0]?.id,
    };
  } catch (error) {
    console.error("Failed to create asset:", error);
    throw error;
  }
};

export default mux;
