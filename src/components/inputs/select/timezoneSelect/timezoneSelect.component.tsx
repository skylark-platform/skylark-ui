import clsx from "clsx";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select";

type TimezoneSelectProps = Omit<SelectProps, "options">;

export const GMT_UTC_OFFSET = "+00:00";

// https://en.wikipedia.org/wiki/List_of_UTC_offsets
// https://en.wikipedia.org/wiki/List_of_time_zone_abbreviations
const UTC_OFFSETS = [
  "-12:00",
  "-11:00",
  "-10:00",
  "-09:30",
  "-09:00",
  "-08:00",
  "-07:00",
  "-06:00",
  "-05:00",
  "-04:00",
  "-03:30",
  "-03:00",
  "-02:00",
  "-01:00",
  GMT_UTC_OFFSET,
  "+01:00",
  "+02:00",
  "+03:00",
  "+03:30",
  "+04:00",
  "+04:30",
  "+05:00",
  "+05:30",
  "+05:45",
  "+06:00",
  "+06:30",
  "+07:00",
  "+08:00",
  "+08:45",
  "+09:00",
  "+09:30",
  "+10:00",
  "+10:30",
  "+11:00",
  "+12:00",
  "+12:45",
  "+13:00",
  "+14:00",
];

const options = UTC_OFFSETS.map((offset): SelectOption => {
  return {
    value: offset,
    label: offset,
  };
});

export const TimezoneSelect = ({
  selected,
  onChange,
  ...props
}: TimezoneSelectProps) => {
  return (
    <Select
      {...props}
      selected={selected || ""}
      onChange={onChange}
      options={options}
      className={clsx(props.variant === "pill" ? "w-32" : props.className)}
      placeholder={props.placeholder || "Timezone"}
      searchable={props.variant !== "pill"}
    />
  );
};
