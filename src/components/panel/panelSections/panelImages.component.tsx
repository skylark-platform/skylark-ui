import { Fragment } from "react";

import { useImageSize } from "src/hooks/useImageSize";
import { SkylarkGraphQLObjectImage } from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

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
      <img className="max-h-72" src={src} alt={title || alt || ""} />
      {title && <p className="mt-1">Title: {title}</p>}
      <p>Original size: {size ? `${size.h}x${size.w}` : ""}</p>
    </div>
  );
};

export const PanelImages = ({
  images,
}: {
  images: SkylarkGraphQLObjectImage[];
}) => {
  const imagesGroupedByType = images.reduce(
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

  return (
    <div className="h-full overflow-y-scroll p-4 pb-12 text-sm md:p-8">
      {images.length === 0 && <p>No images connected to this object.</p>}
      {Object.keys(imagesGroupedByType).map((type) => {
        return (
          <Fragment key={type}>
            <h3 className="mb-6 text-base font-bold">
              {formatObjectField(type)} ({imagesGroupedByType[type].length})
            </h3>
            {imagesGroupedByType[type].map((image) => (
              <PanelImage key={image.uid} src={image.url} title={image.title} />
            ))}
          </Fragment>
        );
      })}
    </div>
  );
};
