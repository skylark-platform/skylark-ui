import clsx from "clsx";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import { Filter, Search } from "src/components/icons";

interface SearchInputProps {
  searchQuery: string;
  className?: string;
  onQueryChange: (str: string) => void;
  toggleFilterOpen: () => void;
}

export const SearchInput = ({
  className,
  searchQuery,
  onQueryChange,
  toggleFilterOpen,
}: SearchInputProps) => {
  const [query, setQuery] = useState(searchQuery);
  const [debouncedQuery] = useDebounce(query, 750);

  useEffect(() => {
    if (debouncedQuery !== searchQuery) {
      onQueryChange(debouncedQuery);
    }
  }, [debouncedQuery, searchQuery, onQueryChange]);

  return (
    <div
      className={clsx(
        "flex w-full flex-row items-center justify-center rounded-full bg-manatee-50 text-sm",
        className,
      )}
    >
      <Search className="ml-6 h-5" />
      <input
        name="search-query-input"
        value={query}
        type="text"
        placeholder="Search for an object(s)"
        className="flex-grow rounded-none bg-inherit p-3 focus:-outline-offset-1 focus:outline-brand-primary"
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        className="flex items-center justify-center gap-2 rounded-r-full bg-manatee-200 p-3 pl-8 pr-10"
        onClick={toggleFilterOpen}
        type="button"
      >
        <Filter />
        <span className="font-medium">
          Filters
          {/* : <span className="text-brand-primary">0</span> */}
        </span>
      </button>
    </div>
  );
};
