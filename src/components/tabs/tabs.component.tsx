import clsx from "clsx";
import { useState } from "react";

interface Props {
  tabs: string[];
}

export const Tabs = ({ tabs }: Props) => {
  const [selected, setSelected] = useState<number>(0);

  return (
    <nav className="border-b border-gray-200 ">
      <div className="border-b border-gray-200 text-center text-sm font-medium">
        <ul className="-mb-px flex flex-wrap">
          {tabs.map((tab, i) => {
            const combinedClassname = clsx(
              selected === i
                ? "text-black border-black"
                : "text-gray-400 border-transparent",
            );
            return (
              <li className="mr-2 ml-4 md:ml-8" key={i}>
                <button
                  onClick={() => setSelected(i)}
                  className={`${combinedClassname} inline-block rounded-t-lg border-b-2 p-2 pb-3 hover:border-black hover:text-black `}
                >
                  {tab}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
