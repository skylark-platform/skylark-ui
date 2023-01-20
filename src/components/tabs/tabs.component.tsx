import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";

interface TabProps {
  tabs: string[];
  selectedTab: number;
  onChange: Dispatch<SetStateAction<number>>;
}

export const Tabs = ({ tabs, selectedTab, onChange }: TabProps) => (
  <ul className="flex w-full items-center justify-start border-b-2 border-gray-200 px-4 text-sm font-medium">
    {tabs.map((tab, i) => {
      const combinedClassname = clsx(
        selectedTab === i
          ? "text-black border-black"
          : "text-gray-400 border-transparent",
      );
      return (
        <li key={`tab-${tab}`} className="px-4">
          <button
            onClick={() => onChange(i)}
            className={clsx(
              "-mb-[2px] w-full border-b-2  pb-3 hover:border-black hover:text-black",
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
