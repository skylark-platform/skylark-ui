import clsx from "clsx";
import { useState } from "react";

interface Props {
  tabs: string[];
}

export const Tabs = ({ tabs }: Props) => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <nav className="border-b border-gray-200 ">
      <div className="border-b border-gray-200 text-center text-sm font-medium">
        <ul className="-mb-px flex flex-wrap">
          {tabs.map((tab, i) => {
            console.log(selected);
            const combinedClassname = clsx(
              selected === i ? "text-black border-black" : "text-gray-500",
            );
            return (
              <li className="mr-2" key={i}>
                <button
                  onClick={() => setSelected(i)}
                  className={`${combinedClassname} inline-block rounded-t-lg border-b-2 border-transparent p-4 hover:border-black hover:text-black `}
                >
                  {tab}
                </button>
              </li>
            );
          })}
          <li className="mr-2">
            <a
              href="#"
              className="inline-block rounded-t-lg border-b-2 border-transparent p-4 hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Metadata
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};
