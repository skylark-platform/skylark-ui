import { getTimeZones } from "@vvo/tzdb";
import clsx from "clsx";
import { useEffect, useMemo } from "react";
import { findTimeZone, getUTCOffset, listTimeZones } from "timezone-support";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select";
import { useUser } from "src/contexts/useUser";

type TimezoneSelectProps = Omit<SelectProps, "options">;

const defaultOptions: SelectOption[] = [];

const arrIndexOrMaxValue = (arr: string[], value: string): number => {
  const valIndex = arr.indexOf(value);
  return valIndex > -1 ? valIndex : Number.MAX_VALUE;
};

export const TimezoneSelect = ({
  selected,
  onChange,
  ...props
}: TimezoneSelectProps) => {
  const timeZonesWithUtc = getTimeZones({ includeUtc: true });

  const timeZones = listTimeZones();
  const xxx = findTimeZone("Atlantic/Faroe");

  console.log({
    timeZonesWithUtc,
    timeZones,
    xxx,
  });

  const options: SelectOption[] = timeZonesWithUtc.map(
    (timezone): SelectOption => {
      const hours = Math.floor(timezone.rawOffsetInMinutes / 60);
      const minutes = timezone.rawOffsetInMinutes % 60;
      const value = `${hours}:${Math.abs(minutes)}`;

      return {
        label: timezone.currentTimeFormat,
        value: timezone.currentTimeFormat,
      };
    },
  );

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
