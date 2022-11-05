import { AiOutlineSearch } from "react-icons/ai";

export const QuickSearch = () => (
  <div className="p-1 w-32 md:w-36 flex items-center group justify-end hover:w-40 focus-within:w-40 md:hover:w-44 md:focus-within:w-44 lg:hover:w-48 lg:focus-within:w-48 transition-width">
    <input
      type="text"
      className="w-0 group-hover:w-full group-focus-within:w-full transition-width group-hover:mr-1 group-focus-within:mr-1 text-sm py-1 group-hover:px-1 group-focus-within:px-1 border-b border-black bg-transparent outline-none"
    />
    <button>
      <AiOutlineSearch className="h-5 w-5 md:h-6 md:w-6 my-1" />
    </button>
    <span className="whitespace-nowrap w-full show group-hover:w-0 group-focus-within:w-0 overflow-hidden transition-width ml-1 group-hover:ml-0 group-focus-within:ml-0">
      {`Quick Search`}
    </span>
  </div>
);
