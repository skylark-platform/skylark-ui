import { KeyboardEvent, useState } from "react";
import { FiSearch } from "react-icons/fi";

interface Props {
  onSearch: (value: string) => void;
}

export const QuickSearch = ({ onSearch }: Props) => {
  const [value, setValue] = useState("");

  const searchOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(value);
    }
  };

  return (
    <div className="group flex w-64 items-center justify-end p-1 transition-width md:w-36 md:focus-within:w-44 md:hover:w-44 lg:focus-within:w-48 lg:hover:w-48">
      <input
        placeholder="Quick Search"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={searchOnEnter}
        className="ml-6 w-full border-b-2 border-gray-300 bg-transparent py-1 text-center text-sm placeholder-gray-400 outline-none transition-all group-focus-within:border-black group-focus-within:placeholder-transparent md:ml-0 md:w-0 md:border-gray-500 md:text-left md:group-focus-within:mr-1 md:group-focus-within:w-full md:group-focus-within:px-1 md:group-hover:mr-1 md:group-hover:w-full md:group-hover:px-1"
      />
      <button onClick={() => onSearch(value)}>
        <FiSearch className="my-1 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-base-content md:h-6 md:w-6 md:text-base-content" />
      </button>
      <span className="ml-1 hidden overflow-hidden whitespace-nowrap text-sm font-semibold transition-width md:block  md:w-full md:group-focus-within:ml-0 md:group-focus-within:w-0 md:group-hover:ml-0 md:group-hover:w-0">
        {`Quick Search`}
      </span>
    </div>
  );
};
