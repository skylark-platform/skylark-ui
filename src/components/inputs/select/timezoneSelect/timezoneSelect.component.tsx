import { getTimeZones } from "@vvo/tzdb";
import clsx from "clsx";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select";

type TimezoneSelectProps = Omit<SelectProps<string>, "options" | "onChange"> & {
  onChange: (timezone: string | null) => void;
};

export const UTC_NAME = "Etc/UTC";

export const TimezoneSelect = ({
  selected,
  onChange,
  ...props
}: TimezoneSelectProps) => {
  const timeZones = getTimeZones({ includeUtc: true });

  const options: SelectOption<string>[] = timeZones.map(({ name }) => ({
    label: `${name}`,
    value: name,
  }));

  const onChangeWrapper = (value: string) => {
    const selectedTimezone = timeZones.find(({ name }) => name === value);

    onChange?.(selectedTimezone?.name || null);
  };

  const selectedTimezone = timeZones.find((timeZone) => {
    return (
      selected &&
      (selected === timeZone.name || timeZone.group.includes(selected))
    );
  });

  return (
    <Select
      {...props}
      selected={
        selectedTimezone?.name ||
        (typeof selected === "string" && selected) ||
        ""
      }
      onChange={onChangeWrapper}
      options={options}
      className={clsx(props.variant === "pill" ? "w-32" : props.className)}
      placeholder={props.placeholder || "Timezone"}
      searchable={props.variant !== "pill"}
      displayRawSelectedValue
    />
  );
};
