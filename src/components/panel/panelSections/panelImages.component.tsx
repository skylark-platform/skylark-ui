import {
  PanelEmptyDataText,
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { useImageSize } from "src/hooks/useImageSize";
import {
  ParsedSkylarkObjectImageRelationship,
  SkylarkGraphQLObjectImage,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

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
    <div className="mb-4 break-words">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="max-h-64" src={src} alt={title || alt || ""} />
      {title && <p className="mt-1">Title: {title}</p>}
      <p>Original size: {size ? `${size.h}x${size.w}` : ""}</p>
    </div>
  );
};

export const PanelImages = ({
  images,
  isPage,
}: {
  isPage?: boolean;
  images: ParsedSkylarkObjectImageRelationship[];
}) => {
  return (
    // TODO try with an object that actually has images, likely need to add a sticky variant of the layout
    // <div className="h-full overflow-y-auto px-4 pb-32 text-sm md:px-8">
    <PanelSectionLayout
      sections={images.map(({ relationshipName }) => ({
        id: `image-panel-${relationshipName}`,
        title: formatObjectField(relationshipName),
      }))}
      isPage={isPage}
      withStickyHeaders
    >
      {images.map(({ relationshipName, objects }) => {
        const imagesGroupedByType = groupImagesByType(objects);
        return (
          <div
            key={`image-relationship-${relationshipName}`}
            className="relative mb-8"
          >
            <PanelSectionTitle
              text={formatObjectField(relationshipName)}
              id={`image-panel-${relationshipName}`}
              sticky
            />
            {objects.length === 0 && (
              <div className="mt-2">
                <PanelEmptyDataText />
              </div>
            )}
            {Object.keys(imagesGroupedByType).map((type) => {
              return (
                <div key={type} className="mb-4">
                  <PanelFieldTitle
                    sticky
                    text={formatObjectField(type)}
                    count={imagesGroupedByType[type].length}
                  />
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
    </PanelSectionLayout>
  );
};
