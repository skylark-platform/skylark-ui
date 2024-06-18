import clsx from "clsx";
import dayjs from "dayjs";
import { useCallback } from "react";
import { FiCalendar, FiClock, FiX } from "react-icons/fi";
import Datepicker, {
  DateValueType,
  Configs,
} from "react-tailwindcss-datepicker";

interface DatePickerProps {
  name: string;
  value: string;
  className?: string;
  disabled?: boolean;
  onChange: (value: DateValueType) => void;
}

const in1Day = dayjs().add(1, "day");
const in1Week = dayjs().add(1, "week");
const in2Weeks = dayjs().add(2, "week");
const in1Month = dayjs().add(1, "month");
const in3Months = dayjs().add(3, "month");
const in6Months = dayjs().add(6, "month");
const in1Year = dayjs().add(1, "year");

const shortCuts = [
  { key: "1day", text: "In a day", date: in1Day },
  { key: "1week", text: "In a week", date: in1Week },
  { key: "2week", text: "In 2 weeks", date: in2Weeks },
  { key: "1month", text: "In a month", date: in1Month },
  { key: "3months", text: "In 3 months", date: in3Months },
  { key: "6months", text: "In 6 months", date: in6Months },
  { key: "1year", text: "In 1 year", date: in1Year },
];

const datePickerConfigs: Configs = {
  shortcuts: shortCuts.reduce(
    (prev, { key, text, date }) => ({
      ...prev,
      [key]: {
        text,
        period: {
          start: date.format("YYYY-MM-DD"),
          end: date.format("YYYY-MM-DD"),
        },
      },
    }),
    {},
  ),
};

const formatDate = (value: string) => {
  return value ? dayjs(value).format("YYYY-MM-DD") : null;
};

export const DatePicker = ({
  name,
  disabled,
  value,
  className,
  onChange,
}: DatePickerProps) => {
  return (
    <Datepicker
      placeholder=" "
      inputName={name}
      inputId={name}
      disabled={disabled}
      toggleIcon={(open) =>
        open ? <FiCalendar className="h-4 w-4" /> : <FiX className="h-4 w-4" />
      }
      value={{
        startDate: formatDate(value),
        endDate: formatDate(value),
      }}
      onChange={onChange}
      useRange={false}
      asSingle
      showShortcuts
      configs={datePickerConfigs}
      popoverDirection="up"
      inputClassName={
        // "w-full rounded bg-manatee-50 p-1 md:p-2 text-sm text-gray-800 focus:ring-brand-primary"
        clsx(
          "w-full bg-manatee-50 text-sm",
          className || "px-4 py-3 rounded-sm",
        )
      }
      containerClassName={(cls) =>
        cls.replace("border-", "") +
        " skylark-ui-date-picker text-sm w-full relative border-none [&_div.absolute.right-0]:left-0 [&_div.absolute.right-0]:right-auto [&_div.absolute.right-0.h-4.w-4]:hidden [&_div.grid.grid-cols-7>button]:h-8 [&_div.grid.grid-cols-7>button]:w-8"
      }
    />
  );
};
