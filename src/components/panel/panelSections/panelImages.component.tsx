import { useState } from "react";

import { SkylarkGraphQLObjectImage } from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

const getImgSize = (url: string, cb: CallableFunction) => {
  const img = new Image();
  img.onload = () => cb(img);
  img.src = url;
};

const PanelImage = ({ image }: { image: SkylarkGraphQLObjectImage }) => {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  getImgSize(image.url, (img: HTMLImageElement) => {
    setSize({
      w: img.naturalWidth,
      h: img.naturalHeight,
    });
  });

  return (
    <div className="break-words pb-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="max-h-72" src={image.url} alt={image.title} />
      <p className="mt-1">Title: {image.title}</p>
      <p>Original size: {size ? `${size.h}x${size.w}` : ""}</p>
    </div>
  );
};

export const PanelImages = ({
  images,
}: {
  images: SkylarkGraphQLObjectImage[];
}) => {
  const imgs = images.reduce(
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
      <h2 className="mb-2 text-xl font-bold">Imagery</h2>
      {Object.keys(imgs).map((type) => {
        return (
          <>
            <h3 className="mt-6 mb-2 font-bold">
              {formatObjectField(type)} ({imgs[type].length})
            </h3>
            {imgs[type].map((image) => (
              <PanelImage key={image.uid} image={image} />
            ))}
          </>
        );
      })}
    </div>
  );
};
