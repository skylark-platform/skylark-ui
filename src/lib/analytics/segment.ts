import { AnalyticsBrowser } from "@segment/analytics-next";

export const segment = AnalyticsBrowser.load({
  writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY as string,
});
