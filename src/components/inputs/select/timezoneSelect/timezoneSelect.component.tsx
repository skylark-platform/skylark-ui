import { getTimeZones, TimeZone, timeZonesNames } from "@vvo/tzdb";
import clsx from "clsx";
import { time } from "console";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select";

type TimezoneSelectProps = Omit<SelectProps, "options" | "onChange"> & {
  onChange: (timezone: string | null) => void;
};

export const GMT_UTC_OFFSET = "+00:00";

const convertMinutesToOffset = (offsetMinutes: number) => {
  const sign = offsetMinutes >= 0 ? "+" : "-";

  const absOffsetMinutes = Math.abs(offsetMinutes);
  const hours = (absOffsetMinutes / 60).toFixed(0);
  const minutes = (absOffsetMinutes % 60).toFixed(0);

  return `${sign}${hours.length === 1 ? `0${hours}` : hours}:${
    minutes.length === 1 ? `0${minutes}` : minutes
  }`;
};

export const TimezoneSelect = ({
  selected,
  onChange,
  ...props
}: TimezoneSelectProps) => {
  const timeZones = getTimeZones({ includeUtc: true });

  const abbreviations = timeZones.reduce((prev, timezone) => {
    const findExisting = prev.find(
      (tz) => tz.abbreviation === timezone.abbreviation,
    );

    if (findExisting) {
      return prev;
    }

    return [...prev, timezone];
  }, [] as TimeZone[]);

  const offsets = timeZones.reduce((prev, timezone) => {
    const findExisting = prev.find(
      (tz) =>
        tz.currentTimeOffsetInMinutes === timezone.currentTimeOffsetInMinutes,
    );

    if (findExisting) {
      return prev;
    }

    return [...prev, timezone];
  }, [] as TimeZone[]);

  const options: SelectOption[] = timeZones.map(
    ({ currentTimeFormat, name }) => ({
      label: currentTimeFormat,
      value: name,
    }),
  );

  // console.log({ timeZones, abbreviations, offsets });

  const onChangeWrapper = (value: string) => {
    console.log({ value });

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
