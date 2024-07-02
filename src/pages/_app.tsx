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
import { useRouter } from "next/router";
import Script from "next/script";
import { useEffect, useState } from "react";
import "react-toastify/dist/ReactToastify.css";

import { AddAuthTokenModal } from "src/components/modals";
import { Navigation } from "src/components/navigation";
import { ToastContainer } from "src/components/toast/toast.component";
import { APP_URL } from "src/constants/skylark";
import { UserProvider } from "src/contexts/useUser";
import { segment } from "src/lib/analytics/segment";
import { createSkylarkReactQueryClient } from "src/lib/graphql/skylark/client";
import "src/styles/globals.css";

const loadFramerMotionFeatures = () =>
  import("../lib/utils/lazyLoadFramerMotionFeatures").then(
    (res) => res.default,
  );

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(createSkylarkReactQueryClient);

  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    segment.page();

    router.events.on("routeChangeComplete", () => segment.page());

    return () => {
      router.events.off("routeChangeComplete", () => segment.page());
    };
  }, [router.events]);

  return (
    <PlausibleProvider domain={APP_URL} enabled={!!APP_URL}>
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
        <AddAuthTokenModal
          isOpen={isAuthModalOpen}
          setIsOpen={setAuthModalOpen}
        />
        <UserProvider>
          <Navigation openAuthModal={() => setAuthModalOpen(true)} />
          {/* This should be removed after beta when we implement real authentication */}
          <LazyMotion features={loadFramerMotionFeatures} strict>
            <Component {...pageProps} />
          </LazyMotion>
        </UserProvider>
        <Script
          strategy="lazyOnload"
          src="https://status.skylarkplatform.com/embed/script.js"
        />
      </QueryClientProvider>
    </PlausibleProvider>
  );
}
