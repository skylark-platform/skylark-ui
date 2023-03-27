import { useImageSize } from "src/hooks/useImageSize";
import {
  ParsedSkylarkObjectImageRelationship,
  SkylarkGraphQLObjectImage,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

const groupImagesByType = (images: SkylarkGraphQLObjectImage[]) => {
  return images.reduce(
    (acc: { [key: string]: SkylarkGraphQLObjectImage[] }, currentValue) => {
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
};

const PanelImage = ({
  src,
  alt,
  title,
}: {
  src: string;
  title?: string;
  alt?: string;
}) => {
  const { size } = useImageSize(src);
  return (
    <div className="break-words pb-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="max-h-64" src={src} alt={title || alt || ""} />
      {title && <p className="mt-1">Title: {title}</p>}
      <p>Original size: {size ? `${size.h}x${size.w}` : ""}</p>
    </div>
  );
};

export const PanelImages = ({
  images,
}: {
  images: ParsedSkylarkObjectImageRelationship[];
}) => {
  return (
    <div className="h-full overflow-y-auto px-4 pb-32 text-sm md:px-8">
      {images.map(({ relationshipName, objects }) => {
        const imagesGroupedByType = groupImagesByType(objects);
        return (
          <div
            key={`image-relationship-${relationshipName}`}
            className="relative mb-4"
          >
            <h3 className="sticky top-0 left-0 z-10 mb-3 bg-white pt-4 text-lg font-bold underline md:pt-8">
              {formatObjectField(relationshipName)}
            </h3>
            {objects.length === 0 && <p>No images connected to this object.</p>}
            {Object.keys(imagesGroupedByType).map((type) => {
              return (
                <div key={type} className="mb-2">
                  <h4 className="sticky top-11 mb-1 bg-white pb-1 text-base font-semibold md:top-14">
                    {formatObjectField(type)} (
                    {imagesGroupedByType[type].length})
                  </h4>
                  {imagesGroupedByType[type].map((image) => (
                    <PanelImage
                      key={image.uid}
                      src={image.url}
                      title={image.title}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
