import clsx from "clsx";
import { useState } from "react";
import { FiRefreshCw, FiX } from "react-icons/fi";
import { useDebouncedCallback } from "use-debounce";

import { Filter, Search } from "src/components/icons";

interface SearchInputProps {
  searchQuery: string;
  className?: string;
  isSearching?: boolean;
  onQueryChange: (str: string) => void;
  toggleFilterOpen: () => void;
  onRefresh: () => void;
}

export const SearchInput = ({
  className,
  searchQuery,
  isSearching,
  onQueryChange,
  toggleFilterOpen,
  onRefresh,
}: SearchInputProps) => {
  const [query, setQuery] = useState(searchQuery);

  const debouncedQueryChange = useDebouncedCallback((value) => {
    onQueryChange(value);
  }, 750);

  const inputChange = (str: string) => {
    setQuery(str);
    debouncedQueryChange(str);
  };

  return (
    <div
      className={clsx(
        "flex w-full flex-row items-center justify-center rounded-full bg-manatee-50 text-sm",
        className,
      )}
    >
      <div className="relative flex w-full items-center rounded-l-full outline-2 focus-within:outline focus-within:-outline-offset-1 focus-within:outline-brand-primary">
        <Search className="ml-2 h-4 md:ml-5 md:h-5" />
        <input
          name="search-query-input"
          value={query}
          type="text"
          placeholder="Search for an object(s)"
          className="min-w-32 flex-grow rounded-none bg-inherit px-1 py-2 pr-0 focus:outline-none md:px-2 md:py-3 md:pr-0"
          onChange={(e) => inputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              debouncedQueryChange.flush();
            }
          }}
        />
        <button
          onClick={() => setQuery("")}
          data-testid="search-clear-query"
          className={clsx(
            "px-1 py-2 transition-opacity focus:outline-brand-primary",
            query
              ? "visible opacity-60 hover:opacity-100"
              : "invisible opacity-0",
          )}
        >
          <FiX className="text-xl" />
        </button>
        <button
          onClick={onRefresh}
          data-testid="search-refresh"
          className="mr-1.5 px-1 py-2 opacity-60 transition-opacity hover:opacity-100 focus:outline-brand-primary md:mr-3"
        >
          <FiRefreshCw
            className={clsx(
              "text-base md:text-lg",
              isSearching && "animate-spin",
            )}
          />
        </button>
      </div>
      <button
        className="flex items-center justify-center space-x-2 rounded-r-full bg-manatee-200 p-2 pl-4 pr-5 focus:outline-brand-primary md:p-3 md:pl-6 md:pr-8"
        onClick={toggleFilterOpen}
        aria-label="open-search-filters"
        type="button"
      >
        <Filter />
        <span className="font-medium">Filters</span>
      </button>
    </div>
  );
};
