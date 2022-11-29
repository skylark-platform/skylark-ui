import Image from "next/image";

import CheckIcon from "public/icons/check-circle.svg";

interface Props {
  label: string;
  options: any; // TODO
}

export const DropDown = ({ label }: Props) => {
  return (
    <>
      <label className="mb-2 block text-sm font-light text-gray-900 ">
        Select your Skylark object type
      </label>
      <select className="block w-full rounded-sm bg-gray-100 p-2 text-sm">
        <option selected disabled>
          Select Skylark object
        </option>
        <option>James Wallis</option>
        <option>james</option>
        <option>rec</option>
      </select>
    </>
  );
};
