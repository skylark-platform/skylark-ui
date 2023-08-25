import { useState } from "react";
import "react-calendar/dist/Calendar.css";
import ReactDatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

export const DatePicker = () => {
  const [value, onChange] = useState<Value>(new Date());

  return (
    <div>
      <ReactDatePicker
        onChange={onChange}
        value={value}
        showDoubleView
        calendarClassName="w-96"
      />
    </div>
  );
};
