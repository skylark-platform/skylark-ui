import dayjs from "dayjs";

import { ObjectAvailability } from "src/interfaces/skylark/objects";
import { formatObjectField } from "src/lib/utils";

interface PanelAvailabilityProps {
  availabilities: ObjectAvailability[];
}

const isAvailabilityFuture = (start: string) => dayjs().isBefore(start);

export const PanelAvailability = ({
  availabilities,
}: PanelAvailabilityProps) => {
  return (
    <div className=" h-full overflow-y-scroll p-4 pb-12 text-sm md:p-8">
      {availabilities.map((availability) => (
        <div
          key={availability.slug}
          className={
            isAvailabilityFuture(availability.start)
              ? "bg-manatee-600"
              : "bg-success"
          }
        >
          <h3 className="mb-2 font-bold ">
            {formatObjectField(availability.title)}
          </h3>
          <div className="mb-4 break-words text-base-content">
            {`${availability.start} - ${availability.end}`}
          </div>
        </div>
      ))}
    </div>
  );
};
