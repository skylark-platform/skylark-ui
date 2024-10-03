import setupAmpSRSegmentWrapper from "@amplitude/segment-session-replay-wrapper";
import { AnalyticsBrowser } from "@segment/analytics-next";

export const segment: AnalyticsBrowser = AnalyticsBrowser.load({
  writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY as string,
});

setupAmpSRSegmentWrapper({
  segmentInstance: segment,
  amplitudeApiKey: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY as string,
  sessionReplayOptions: {
    logLevel: 4,
    sampleRate: 1,
    debugMode: true,
  },
});
