import dayjs from "dayjs";

import { ObjectAvailability } from "src/interfaces/skylark/objects";
import { formatObjectField } from "src/lib/utils";

interface PanelAvailabilityProps {
  availability: ObjectAvailability;
}

export const PanelAvailability = ({ availability }: PanelAvailabilityProps) => {
  return (
    <div className=" h-full overflow-y-scroll p-4 pb-12 text-sm md:p-8">
      <span className="uppercase">{availability.status}</span>
      {availability.objects.map((obj) => (
        <div key={obj.slug} className="">
          <h3 className="mb-2 font-bold ">{formatObjectField(obj.title)}</h3>
          <div className="mb-4 break-words text-base-content">
            {`${obj.start} - ${obj.end}`}
          </div>
        </div>
      ))}
    </div>
  );
};
