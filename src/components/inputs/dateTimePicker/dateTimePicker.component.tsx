import dayjs from "dayjs";
import { useCallback } from "react";
import { FiCalendar, FiClock, FiX } from "react-icons/fi";
import Datepicker, {
  DateValueType,
  Configs,
} from "react-tailwindcss-datepicker";

import { DatePicker } from "src/components/inputs/datePicker";
import { Input } from "src/components/inputs/input";

interface DateTimePickerProps {
  name: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
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

const formatTime = (value: string) => {
  return value ? dayjs(value).format("HH:mm:ss") : "";
};

export const DateTimePicker = ({
  name,
  disabled,
  value,
  onChange,
}: DateTimePickerProps) => {
  const handleDateChange = useCallback(
    (newDateRange: DateValueType) => {
      const newDate = newDateRange?.startDate;

      if (!newDate) {
        onChange("");
        return;
      }

      const parsedDate =
        typeof newDate === "string" ? new Date(newDate) : newDate;

      const updated = dayjs(value || undefined)
        .year(parsedDate.getFullYear())
        .month(parsedDate.getMonth())
        .date(parsedDate.getDate())
        .second(0)
        .millisecond(0);

      const isoDate = updated.toISOString();

      onChange(isoDate);
    },
    [onChange, value],
  );

  const handleTimeChange = useCallback(
    (newTime: string) => {
      if (!newTime) {
        return;
      }

      const parsedTimes = newTime.split(":").map((val): number => {
        try {
          return parseInt(val) || 0;
        } catch {
          return 0;
        }
      });

      const updated = dayjs(value || undefined)
        .hour(parsedTimes?.[0] || 0)
        .minute(parsedTimes?.[1] || 0)
        .second(0)
        .millisecond(0);

      const isoDate = updated.toISOString();

      onChange(isoDate);
    },
    [onChange, value],
  );

  return (
    <div
      className="grid grid-cols-6 items-center justify-center gap-1 w-full bg-manatee-50 text-sm rounded-sm"
      data-testid="datetime-picker"
    >
      <div className={"relative w-full col-span-4"}>
        <DatePicker
          onChange={handleDateChange}
          value={value}
          className="py-3 pl-4"
          name={name}
        />
      </div>
      <div className="relative col-span-2 w-full">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 top-0 flex items-center pe-3 text-manatee-500 z-[1]">
            <FiClock className="h-4 w-4" aria-hidden={true} />
          </div>
          <Input
            name={`${name}-time`}
            type="time"
            step={60}
            disabled={disabled}
            onChange={handleTimeChange}
            id={`${name}-time`}
            className="py-3 w-full md:py-3"
            // className="form-input w-full rounded-lg border border-gray-200 p-3 text-base text-gray-800 focus:ring-brand-primary"
            value={formatTime(value)}
          />
        </div>
      </div>
    </div>
  );
};
