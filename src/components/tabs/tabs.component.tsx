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
            console.log(selected);
            const combinedClassname = clsx(
              selected === i
                ? "text-black border-black"
                : "text-gray-400 border-transparent",
            );
            return (
              <li className="mr-2" key={i}>
                <button
                  onClick={() => setSelected(i)}
                  className={`${combinedClassname} inline-block rounded-t-lg border-b-2  p-4 hover:border-black hover:text-black `}
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
