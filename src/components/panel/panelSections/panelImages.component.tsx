import { ObjectImage } from "src/interfaces/skylark/objects";
import { formatObjectField } from "src/lib/utils";

export const PanelImages = ({ images }: { images: ObjectImage[] }) => {
  const imgs = images.reduce(
    (acc: { [key: string]: ObjectImage[] }, currentValue) => {
      if (acc && acc[currentValue.type])
        return {
          ...acc,
          [currentValue.type]: [...acc[currentValue.type], currentValue],
        };
      return {
        ...acc,
        [currentValue.type]: [currentValue],
      };
    },
    {},
  );

  return (
    <div className=" h-full overflow-y-scroll p-4 pb-12 text-sm md:p-8">
      <h2 className="mb-4 text-xl font-bold">Imagery</h2>
      {Object.keys(imgs).map((type) => {
        return (
          <>
            <h3 className="mt-2 mb-4 font-bold">
              {formatObjectField(type)} ({imgs[type].length})
            </h3>
            {imgs[type].map((image) => (
              <div key={image.uid} className="pb-4">
                <div className="flex flex-row">
                  <div className="w-1/2 pr-4">
                    <div className="flex flex-row pb-1">
                      <div className="w-1/2">title: </div>
                      <div className="w-1/2">
                        {formatObjectField(image.title) || "---"}
                      </div>
                    </div>
                    <div className="flex flex-row pb-1">
                      <div className="w-1/2">content_type: </div>
                      <div className="w-1/2">
                        {formatObjectField(image.content_type) || "---"}
                      </div>
                    </div>
                    <div className="flex flex-row pb-1">
                      <div className="w-1/2">description: </div>
                      <div className="w-1/2">
                        {formatObjectField(image.description) || "---"}
                      </div>
                    </div>
                  </div>
                  <div className=" w-1/2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="m-auto max-h-64"
                      src={image.url}
                      alt="Picture of the author"
                    />
                  </div>
                </div>
              </div>
            ))}
          </>
        );
      })}
    </div>
  );
};
