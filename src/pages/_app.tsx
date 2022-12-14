import { ApolloProvider } from "@apollo/client";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/work-sans/700.css";
import type { AppProps } from "next/app";
import Head from "next/head";

import { Navigation } from "src/components/navigation";
import { createSkylarkClient } from "src/lib/graphql/skylark/client";
import "src/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const client = createSkylarkClient();

  return (
    <ApolloProvider client={client}>
      <Head>
        <title>Skylark</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
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
      <Navigation />
      <Component {...pageProps} />
    </ApolloProvider>
  );
}
