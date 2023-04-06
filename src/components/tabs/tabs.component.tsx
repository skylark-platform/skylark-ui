import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";

interface TabProps {
  tabs: string[];
  selectedTab: string;
  onChange: Dispatch<SetStateAction<string>>;
  disabled?: boolean;
}

export const Tabs = ({ tabs, selectedTab, disabled, onChange }: TabProps) => (
  <ul className="flex w-full items-center justify-start px-2 pb-[2px] text-sm font-medium md:px-4">
    {tabs.map((tab) => {
      return (
        <li key={`tab-${tab}`} className="px-2 md:px-3">
          <button
            disabled={disabled}
            onClick={disabled ? undefined : () => onChange(tab)}
            className={clsx(
              "-mb-[2px] w-full rounded-t border-b-2 p-1 pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary md:pb-3",
              !disabled && "hover:border-black hover:text-black",
              selectedTab === tab
                ? "border-black text-black"
                : "border-transparent text-gray-400",
            )}
          >
            {tab}
          </button>
        </li>
      );
    })}
  </ul>
);
