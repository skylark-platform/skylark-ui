import { FiZap, FiX as ReactIconFiX } from "react-icons/fi";
import { IconType } from "react-icons/lib";

export const FiX: IconType = (props) => (
  <ReactIconFiX {...props} viewBox="4 4 16 16" />
);

export const DynamicContentIcon = () => (
  <div className="bg-manatee-600 p-1 h-5 w-5 flex justify-center items-center rounded-full">
    <FiZap className="text-white" />
  </div>
);
