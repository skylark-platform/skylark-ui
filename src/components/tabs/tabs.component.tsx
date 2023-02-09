import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";

interface TabProps {
  tabs: string[];
  selectedTab: string;
  onChange: Dispatch<SetStateAction<string>>;
  disabled?: boolean;
}

export const Tabs = ({ tabs, selectedTab, disabled, onChange }: TabProps) => (
  <ul className="flex w-full items-center justify-start border-b-2 border-gray-200 px-2 text-sm font-medium md:px-4">
    {tabs.map((tab) => {
      const combinedClassname = clsx(
        selectedTab === tab
          ? "text-black border-black"
          : "text-gray-400 border-transparent",
      );
      return (
        <li key={`tab-${tab}`} className="px-3 md:px-4">
          <button
            disabled={disabled}
            onClick={disabled ? undefined : () => onChange(tab)}
            className={clsx(
              "-mb-[2px] w-full border-b-2 pb-3 ",
              !disabled && "hover:border-black hover:text-black",
              combinedClassname,
            )}
          >
            {tab}
          </button>
        </li>
      );
    })}
  </ul>
);
