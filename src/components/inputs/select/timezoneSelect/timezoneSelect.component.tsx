import clsx from "clsx";

import { Select, SelectProps } from "src/components/inputs/select";

type TimezoneSelectProps = Omit<SelectProps, "options">;

export const TimezoneSelect = ({
  selected,
  onChange,
  ...props
}: TimezoneSelectProps) => {
  // const timeZonesWithUtc = getTimeZones({ includeUtc: true });

  // const timeZones = listTimeZones();
  // const xxx = findTimeZone("Atlantic/Faroe");

  // console.log({
  //   timeZonesWithUtc,
  //   timeZones,
  //   xxx,
  // });

  // const options: SelectOption[] = timeZonesWithUtc.map(
  //   (timezone): SelectOption => {
  //     const hours = Math.floor(timezone.rawOffsetInMinutes / 60);
  //     const minutes = timezone.rawOffsetInMinutes % 60;
  //     const value = `${hours}:${Math.abs(minutes)}`;

  //     return {
  //       label: timezone.currentTimeFormat,
  //       value: timezone.currentTimeFormat,
  //     };
  //   },
  // );

  return (
    <Select
      {...props}
      selected={selected || ""}
      onChange={onChange}
      options={[]}
      className={clsx(props.variant === "pill" ? "w-32" : props.className)}
      placeholder={props.placeholder || "Timezone"}
      searchable={props.variant !== "pill"}
    />
  );
};
