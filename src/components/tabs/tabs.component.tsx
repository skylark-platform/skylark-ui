import clsx from "clsx";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";

export type Tab<TabID = string> = { id: TabID; name: string };

interface TabProps<T> {
  tabs: Tab<T>[];
  selectedTab: string;
  onChange: (t: Tab<T> & { index: number }) => void;
  disabled?: boolean;
  className?: string;
  fillWidth?: boolean;
  onDelete?: (t: Tab<T> & { index: number }) => void;
}

interface ReorderableTabProps<T> extends TabProps<T> {
  onReorder: (tabs: Tab<T>[]) => void;
}

const generateUlClassName = (className?: string) =>
  clsx(
    "flex w-full items-center justify-start pb-[2px] text-xs font-medium md:text-sm",
    className,
  );

const generateLiClassName = ({
  withDelete,
  disabled,
  isSelectedTab,
  fillWidth,
}: {
  withDelete: boolean;
  disabled?: boolean;
  isSelectedTab: boolean;
  fillWidth?: boolean;
}) =>
  clsx(
    "flex relative border-b-2 -mb-[2px] group/tab-container bg-white",
    withDelete ? "mx-1 md:mx-2" : "mx-2 md:mx-3",
    !disabled && "hover:border-black hover:text-black",
    fillWidth && "grow justify-center",
    isSelectedTab
      ? "border-black text-black"
      : "border-transparent text-gray-400",
  );

export const convertStringArrToTabs = (arr: string[]): Tab[] =>
  arr.map((str) => ({ id: str, name: str }));

const Tab = <T,>({
  disabled,
  onChange,
  tab,
  onDelete,
  index,
  selectedTab,
}: TabProps<T> & { tab: Tab<T>; index: number }) => {
  return (
    <>
      <button
        disabled={disabled}
        onClick={disabled ? undefined : () => onChange({ ...tab, index })}
        className={clsx(
          "w-full whitespace-nowrap rounded-t focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary p-1 pb-1.5 pr-0.5 md:pb-2.5",
          "min-w-10 max-w-52 overflow-hidden text-ellipsis",
        )}
      >
        {tab.name}
      </button>
      {onDelete && !disabled && (
        <div className="flex justify-end bg-gradient-to-r from-transparent via-white/90 to-white pb-1.5 pt-1 md:pb-2.5">
          <button
            className="group/button rounded-full ml-0.5 p-0.5 hover:bg-gray-100/20 hover:shadow-inner"
            onClick={() => onDelete({ ...tab, index })}
            aria-label={
              tab.id === selectedTab
                ? "delete active tab"
                : `delete tab ${tab.id}`
            }
          >
            <FiX
              className={clsx(
                "text-base font-bold group-hover/button:text-black",
                tab.id === selectedTab
                  ? "text-gray-600"
                  : "text-gray-400 group-hover/tab-container:text-gray-600",
              )}
            />
          </button>
        </div>
      )}
    </>
  );
};

export const Tabs = <T extends string>(props: TabProps<T>) => {
  const { tabs, selectedTab, disabled, fillWidth, onDelete } = props;
  return (
    <ul className={generateUlClassName(props.className)}>
      {tabs.map((tab, index) => (
        <li
          key={tab.id}
          className={generateLiClassName({
            withDelete: !!onDelete,
            isSelectedTab: selectedTab === tab.id,
            disabled,
            fillWidth,
          })}
        >
          <Tab {...props} tab={tab} index={index} />
        </li>
      ))}
    </ul>
  );
};

export const ReorderableTabs = <T extends string>(
  props: ReorderableTabProps<T>,
) => {
  const {
    tabs,
    selectedTab,
    disabled,
    className,
    fillWidth,
    onDelete,
    onReorder,
  } = props;

  return (
    <Reorder.Group
      className={generateUlClassName(className)}
      axis="x"
      values={tabs}
      onReorder={onReorder}
      as="ul"
    >
      {tabs.map((tab, index) => {
        return (
          <Reorder.Item
            key={tab.id}
            className={generateLiClassName({
              withDelete: !!onDelete,
              isSelectedTab: selectedTab === tab.id,
              disabled,
              fillWidth,
            })}
            value={tab}
            as="li"
          >
            <Tab {...props} tab={tab} index={index} />
          </Reorder.Item>
        );
      })}
    </Reorder.Group>
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
    <motion.button
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
        <FiChevronLeft className="h-5 w-5" />
      ) : (
        <FiChevronRight className="h-5 w-5" />
      )}
    </motion.button>
  );
};

export const ScrollableTabs = <T extends string>({
  initialScrollPosition,
  onScroll,
  ...props
}: TabProps<T> & {
  initialScrollPosition?: number;
  onScroll?: (o: { scrollLeft: number }) => void;
  onReorder?: ReorderableTabProps<T>["onReorder"];
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
        {props.onReorder ? (
          <ReorderableTabs {...props} onReorder={props.onReorder} />
        ) : (
          <Tabs {...props} />
        )}
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
