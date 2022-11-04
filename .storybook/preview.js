import "../src/styles/globals.css";
import "@fontsource/work-sans/700.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import { RouterContext } from "next/dist/shared/lib/router-context";
import * as NextImage from "next/image";

const OriginalNextImage = NextImage.default;

Object.defineProperty(NextImage, "default", {
  configurable: true,
  value: (props) => <OriginalNextImage {...props} unoptimized />,
});

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  nextRouter: {
    Provider: RouterContext.Provider,
  },
};
