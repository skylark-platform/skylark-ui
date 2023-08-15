import clsx from "clsx";

interface TabProps {
  tabs: string[];
  selectedTab: string;
  onChange: (t: { index: number; tab: string }) => void;
  disabled?: boolean;
  className?: string;
}

export const Tabs = ({
  tabs,
  selectedTab,
  disabled,
  className,
  onChange,
}: TabProps) => (
  <ul
    className={clsx(
      "flex w-full items-center justify-start pb-[2px] text-xs font-medium md:text-sm",
      className,
    )}
  >
    {tabs.map((tab, index) => {
      return (
        <li key={`tab-${tab}`} className=" px-2 md:px-3">
          <button
            disabled={disabled}
            onClick={disabled ? undefined : () => onChange({ tab, index })}
            className={clsx(
              "-mb-[2px] w-full whitespace-nowrap rounded-t border-b-2 p-1 pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary md:pb-3",
              !disabled && "hover:border-black hover:text-black",
              selectedTab === tab
                ? "border-black text-black"
                : "border-transparent text-gray-400",
              "max-w-52 overflow-hidden text-ellipsis",
            )}
          >
            {tab}
          </button>
        </li>
      );
    })}
  </ul>
);
