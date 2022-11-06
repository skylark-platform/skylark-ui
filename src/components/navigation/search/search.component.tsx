import { AiOutlineSearch } from "react-icons/ai";

export const QuickSearch = () => (
  <div className="group flex w-32 items-center justify-end p-1 transition-width focus-within:w-40 hover:w-40 md:w-36 md:focus-within:w-44 md:hover:w-44 lg:focus-within:w-48 lg:hover:w-48">
    <input
      type="text"
      className="w-0 border-b border-black bg-transparent py-1 text-sm outline-none transition-width group-focus-within:mr-1 group-focus-within:w-full group-focus-within:px-1 group-hover:mr-1 group-hover:w-full group-hover:px-1"
    />
    <button>
      <AiOutlineSearch className="my-1 h-5 w-5 md:h-6 md:w-6" />
    </button>
    <span className="show ml-1 w-full overflow-hidden whitespace-nowrap transition-width group-focus-within:ml-0 group-focus-within:w-0 group-hover:ml-0 group-hover:w-0">
      {`Quick Search`}
    </span>
  </div>
);
