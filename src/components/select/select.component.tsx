import { Listbox, Transition } from "@headlessui/react";
import clsx from "clsx";
import { useState, Fragment } from "react";
import { GoTriangleDown } from "react-icons/go";

type Value = string | number;

interface Option {
  label: string;
  value: Value;
}

interface Props {
  options: Option[];
  label?: string;
  placeholder: string;
  onChange: (value: Value) => void;
}

export const Select = ({ options, label, placeholder, onChange }: Props) => {
  const [selected, setSelected] = useState<Option | null>(null);

  const onChangeWrapper = (newSelected: Option) => {
    setSelected(newSelected);
    onChange(newSelected.value);
  };

  // TODO figure out why option highlighting only works in Storybook

  return (
    <Listbox onChange={onChangeWrapper}>
      <div className="relative">
        {label && <Listbox.Label className="font-light">{label}</Listbox.Label>}
        <Listbox.Button
          className={clsx(
            "relative w-full cursor-default rounded-sm bg-manatee-50 p-3 pl-6 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm",
            label && "mt-2",
          )}
        >
          <span
            className={clsx(
              "block truncate",
              !selected?.label && "text-gray-300",
            )}
          >
            {selected?.label || placeholder || "Select option"}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <GoTriangleDown className="h-3 w-3 text-black" aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.map((option) => (
              <Listbox.Option
                key={option.value}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 px-4 pl-6 ${
                    active ? "bg-ultramarine-50 text-gray-900" : "text-gray-900"
                  }`
                }
                value={option}
              >
                {({ selected }) => (
                  <span
                    className={`block truncate ${
                      selected ? "font-medium" : "font-normal"
                    }`}
                  >
                    {option.label}
                  </span>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};
