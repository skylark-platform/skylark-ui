import { useState } from "react";

import { Button } from "src/components/button";

interface Props {
  tabs: string[];
}

export const Tabs = ({ tabs }: any) => {
  const [selected, setSelected] = useState("");

  return (
    <nav className="border-b border-gray-200 ">
      <div className="border-b border-gray-200 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <ul className="-mb-px flex flex-wrap">
          {tabs.map((tab, i) => (
            <li className="mr-2" key={i}>
              <a
                href="#"
                className="inline-block rounded-t-lg border-b-2 border-transparent p-4 hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Metadata
              </a>
            </li>
          ))}
          <li className="mr-2">
            <a
              href="#"
              className="inline-block rounded-t-lg border-b-2 border-transparent p-4 hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Metadata
            </a>
          </li>
          <li className="mr-2">
            <a
              href="#"
              className="active inline-block rounded-t-lg border-b-2 border-blue-600 p-4 text-blue-600 dark:border-blue-500 dark:text-blue-500"
              aria-current="page"
            >
              Availability
            </a>
          </li>
          <li className="mr-2">
            <a
              href="#"
              className="inline-block rounded-t-lg border-b-2 border-transparent p-4 hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Imagery
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};
