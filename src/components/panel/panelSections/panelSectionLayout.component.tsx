import clsx from "clsx";
import { ReactNode, Ref, forwardRef } from "react";

import { hasProperty } from "src/lib/utils";

type Section = {
  title: string;
  id: string;
  htmlId: string;
};

interface PanelSectionLayoutProps {
  isPage?: boolean;
  sections: Section[];
  withStickyHeaders?: boolean;
  children?: ReactNode;
  withoutPadding?: boolean;
  onSectionClick?: (s: Section) => void;
}

const scrollToSection = (id: string) =>
  // Smooth scrolling breaks Cypress tests, we might want to refactor this to be global if we add another smooth scroll
  (
    document?.getElementById(`panel-section-${id}`) ||
    document?.getElementById(id)
  )?.scrollIntoView({
    behavior:
      typeof window === "undefined" || hasProperty(window, "Cypress")
        ? "auto"
        : "smooth",
  });

export const PanelSectionLayoutComponent = (
  {
    isPage,
    sections,
    withStickyHeaders,
    withoutPadding,
    children,
    onSectionClick,
  }: PanelSectionLayoutProps,
  ref: Ref<HTMLDivElement>,
) => (
  <div
    className={clsx(
      "mx-auto w-full max-w-7xl flex-grow overflow-y-hidden text-sm",
      isPage && "sm:grid sm:grid-cols-[1fr_3fr]",
    )}
  >
    {isPage && (
      <div
        className="pointer hidden flex-col p-4 text-left text-sm font-semibold sm:flex md:p-8"
        data-testid="panel-page-side-navigation"
      >
        {sections.map((section) => (
          <button
            key={`panel-section-scroll-button-${section.id}`}
            onClick={() =>
              onSectionClick
                ? onSectionClick(section)
                : scrollToSection(section.htmlId || section.id)
            }
            className="py-3 text-left text-manatee-700 transition-colors hover:text-black"
          >
            {section.title}
          </button>
        ))}
      </div>
    )}
    <div className="h-full overflow-y-auto" ref={ref}>
      <div
        className={clsx(
          "relative h-full flex flex-col",
          !withoutPadding && "pb-32 md:pb-56",
          !withoutPadding && withStickyHeaders && "px-6 md:px-8",
          !withoutPadding && !withStickyHeaders && "p-6 md:p-8",
        )}
      >
        {children}
      </div>
    </div>
  </div>
);

export const PanelSectionLayout = forwardRef(PanelSectionLayoutComponent);
