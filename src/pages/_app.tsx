import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/work-sans/700.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion } from "framer-motion";
import PlausibleProvider from "next-plausible";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import { IntercomProvider } from "react-use-intercom";

import { Navigation } from "src/components/navigation";
import { ToastContainer } from "src/components/toast/toast.component";
import { APP_URL } from "src/constants/skylark";
import { UserProvider } from "src/contexts/useUser";
import { createSkylarkReactQueryClient } from "src/lib/graphql/skylark/client";
import "src/styles/globals.css";

const loadFramerMotionFeatures = () =>
  import("../lib/utils/lazyLoadFramerMotionFeatures").then(
    (res) => res.default,
  );

const intercomAppId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(createSkylarkReactQueryClient);

  return (
    <PlausibleProvider domain={APP_URL} enabled={!!APP_URL}>
      <IntercomProvider
        appId={intercomAppId || ""}
        autoBoot
        shouldInitialize={!!intercomAppId}
      >
        <QueryClientProvider client={queryClient}>
          <ToastContainer />
          <Head>
            <title>Skylark</title>
            <meta
              name="viewport"
              content="initial-scale=1.0, width=device-width"
            />
            <link
              href="/favicons/apple-touch-icon.png"
              rel="apple-touch-icon"
              sizes="180x180"
            />
            <link
              href="/favicons/favicon-32x32.png"
              rel="icon"
              sizes="32x32"
              type="image/png"
            />
            <link
              href="/favicons/favicon-16x16.png"
              rel="icon"
              sizes="16x16"
              type="image/png"
            />
            <link href="/favicons/site.webmanifest" rel="manifest" />
            <link href="/favicons/favicon.ico" rel="icon" />
          </Head>
          <UserProvider>
            <Navigation />
            <LazyMotion features={loadFramerMotionFeatures} strict>
              <Component {...pageProps} />
            </LazyMotion>
          </UserProvider>
          <Script
            strategy="lazyOnload"
            src="https://status.skylarkplatform.com/embed/script.js"
          />
          <script>
            {`!function(){var i="analytics",analytics=window[i]=window[i]||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","screen","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware","register"];analytics.factory=function(e){return function(){if(window[i].initialized)return window[i][e].apply(window[i],arguments);var n=Array.prototype.slice.call(arguments);if(["track","screen","alias","group","page","identify"].indexOf(e)>-1){var c=document.querySelector("link[rel='canonical']");n.push({__t:"bpc",c:c&&c.getAttribute("href")||void 0,p:location.pathname,u:location.href,s:location.search,t:document.title,r:document.referrer})}n.unshift(e);analytics.push(n);return analytics}};for(var n=0;n<analytics.methods.length;n++){var key=analytics.methods[n];analytics[key]=analytics.factory(key)}analytics.load=function(key,n){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute("data-global-segment-analytics-key",i);t.src="https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r);analytics._loadOptions=n};analytics._writeKey="FGkh1TJthHA5XxNJiTm4GruXGUPXlZdk";;analytics.SNIPPET_VERSION="5.2.0";
            analytics.load("FGkh1TJthHA5XxNJiTm4GruXGUPXlZdk");
            analytics.page();
            }}();`}
          </script>
        </QueryClientProvider>
      </IntercomProvider>
    </PlausibleProvider>
  );
}
