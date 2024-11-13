import setupAmpSRSegmentWrapper from "@amplitude/segment-session-replay-wrapper";
import { PluginOptions } from "@amplitude/segment-session-replay-wrapper/lib/esm/types";
import { AnalyticsBrowser as SegmentAnalyticsBrowser } from "@segment/analytics-next";

export const segment: SegmentAnalyticsBrowser = SegmentAnalyticsBrowser.load({
  writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY as string,
});

setupAmpSRSegmentWrapper({
  segmentInstance: segment as unknown as PluginOptions["segmentInstance"],
  amplitudeApiKey: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY as string,
  sessionReplayOptions: {
    logLevel: 4,
    sampleRate: 1,
    debugMode: false,
  },
});
