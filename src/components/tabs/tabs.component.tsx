import clsx from "clsx";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChevronLeft, ChevronRight } from "src/components/icons";

type Tab = { id: string; name: string };

interface TabProps {
  tabs: Tab[] | string[];
  selectedTab: string;
  onChange: (t: Tab & { index: number }) => void;
  disabled?: boolean;
  className?: string;
}

export const Tabs = ({
  tabs: propTabs,
  selectedTab,
  disabled,
  className,
  onChange,
}: TabProps) => {
  const tabs: Tab[] = useMemo(
    () =>
      propTabs.map((tab) =>
        typeof tab === "string" ? { id: tab, name: tab } : tab,
      ),
    [propTabs],
  );

  return (
    <ul
      className={clsx(
        "flex w-full items-center justify-start pb-[2px] text-xs font-medium md:text-sm",
        className,
      )}
    >
      {tabs.map((tab, index) => {
        return (
          <li key={`tab-${tab.id}`} className="px-2 md:px-3">
            <button
              disabled={disabled}
              onClick={disabled ? undefined : () => onChange({ ...tab, index })}
              className={clsx(
                "-mb-[2px] w-full whitespace-nowrap rounded-t border-b-2 p-1 pb-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary md:pb-2.5",
                !disabled && "hover:border-black hover:text-black",
                selectedTab === tab.id
                  ? "border-black text-black"
                  : "border-transparent text-gray-400",
                "min-w-10 max-w-52 overflow-hidden text-ellipsis",
              )}
            >
              {tab.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

const ScrollableTabScrollButton = ({
  type,
  onClick,
}: {
  type: "left" | "right";
  onClick: () => void;
}) => {
  const x = type === "left" ? -50 : 50;

  return (
    <m.button
      className={clsx(
        "absolute bottom-0 flex items-center justify-center border-b border-transparent bg-white px-0.5 py-2 text-gray-400 hover:bg-manatee-50 hover:text-black md:px-2 md:py-3",
        "before:absolute before:bottom-0 before:z-[2] before:h-full before:w-1 before:from-manatee-400/25 before:to-manatee-400 before:content-['']",
        type === "left" && "left-0 before:-right-1 before:bg-gradient-to-l",
        type === "right" && "right-0 before:-left-1 before:bg-gradient-to-r",
      )}
      onClick={onClick}
      initial={{ x }}
      animate={{ x: 0 }}
      exit={{ x }}
      transition={{ bounce: 0 }}
    >
      {type === "left" ? (
        <ChevronLeft className="h-5 w-5" />
      ) : (
        <ChevronRight className="h-5 w-5" />
      )}
    </m.button>
  );
};

export const ScrollableTabs = ({
  initialScrollPosition,
  onScroll,
  ...props
}: TabProps & {
  initialScrollPosition?: number;
  onScroll?: (o: { scrollLeft: number }) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [scrollPosition, setScrollPosition] = useState(
    initialScrollPosition || 0,
  );

  const containerWidth = containerRef.current?.clientWidth || 0;
  const scrollWidth = containerRef.current?.scrollWidth || containerWidth || 0;

  const hasScrollbar = scrollWidth > containerWidth;
  const showLeftArrow = hasScrollbar && scrollPosition > 0;
  const showRightArrow =
    hasScrollbar &&
    (scrollPosition + containerWidth < scrollWidth ||
      scrollWidth <= containerWidth);

  const scroll = (position: number, behavior?: "smooth" | "instant") => {
    if (containerRef.current && containerRef.current?.scrollTo) {
      containerRef.current.scrollTo({
        left: position,
        behavior: behavior || "smooth",
      });
    }
  };

  useEffect(() => {
    scroll(scrollPosition, "instant");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full overflow-x-hidden">
      <div
        className="scrollbar-hidden flex h-full w-full items-end overflow-scroll"
        ref={containerRef}
        onScroll={(e) => {
          const scrollLeft = e.currentTarget.scrollLeft;
          setScrollPosition(scrollLeft);
          onScroll?.({ scrollLeft });
        }}
      >
        <Tabs {...props} />
      </div>

      <AnimatePresence>
        {showLeftArrow && (
          <ScrollableTabScrollButton
            key="scroll-button-left"
            type="left"
            onClick={() => {
              const newPosition = scrollPosition - containerWidth;
              scroll(newPosition > 0 ? newPosition : 0);
            }}
          />
        )}

        {showRightArrow && (
          <ScrollableTabScrollButton
            key="scroll-button-right"
            type="right"
            onClick={() => {
              const newPosition = scrollPosition + containerWidth;
              scroll(newPosition < scrollWidth ? newPosition : scrollWidth);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
