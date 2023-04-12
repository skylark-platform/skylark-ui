import clsx from "clsx";
import { ReactNode } from "react";

import { hasProperty } from "src/lib/utils";

interface PanelSectionLayoutProps {
  isPage?: boolean;
  sections: {
    title: string;
    id: string;
  }[];
  withStickyHeaders?: boolean;
  children?: ReactNode;
}

const scrollToSection = (id: string) =>
  // Smooth scrolling breaks Cypress tests, we might want to refactor this to be global if we add another smooth scroll
  document?.getElementById(id)?.scrollIntoView({
    behavior:
      typeof window === "undefined" || hasProperty(window, "Cypress")
        ? "auto"
        : "smooth",
  });

export const PanelSectionLayout = ({
  isPage,
  sections,
  withStickyHeaders,
  children,
}: PanelSectionLayoutProps) => (
  <div
    className={clsx(
      "mx-auto w-full max-w-7xl flex-grow overflow-y-hidden text-sm ",
      isPage && "sm:grid sm:grid-cols-[1fr_3fr]",
    )}
  >
    {isPage && (
      <div
        className="pointer hidden flex-col p-4 text-left text-sm font-semibold sm:flex md:p-8"
        data-testid="panel-page-side-navigation"
      >
        {sections.map(({ id, title }) => (
          <button
            key={`panel-section-scroll-button-${id}`}
            onClick={() => scrollToSection(id)}
            className="py-3 text-left text-manatee-700 transition-colors hover:text-black"
          >
            {title}
          </button>
        ))}
      </div>
    )}
    <div className="h-full overflow-y-auto">
      <div
        className={clsx(
          "relative pb-20 md:pb-32",
          withStickyHeaders ? "px-4 md:px-8" : "p-4 md:p-8",
        )}
      >
        {children}
      </div>
    </div>
  </div>
);
