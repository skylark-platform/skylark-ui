import { SkylarkGraphQLObjectImage } from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

export const PanelImages = ({
  images,
}: {
  images: SkylarkGraphQLObjectImage[];
}) => {
  return (
    <div className=" h-full overflow-y-scroll p-4 pb-12 text-sm md:p-8">
      {images.map((image) => (
        <div key={image.uid}>
          <h3 className="mb-2 font-bold">{formatObjectField(image.type)}</h3>
          <div className="flex flex-row">
            <div className="w-1/2">
              Title: {formatObjectField(image.title)}
              Description: {formatObjectField(image.description)}
            </div>
            <div className="w-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="max-h-72 w-full object-cover"
                src={image.url}
                alt={
                  image.title ||
                  image.description ||
                  `Preview for ${
                    image.url || image.slug || image.external_id || image.uid
                  }`
                }
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
