import { OpenObjectButton } from "src/components/button";
import {
  PanelEmptyDataText,
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { useImageSize } from "src/hooks/useImageSize";
import {
  BuiltInSkylarkObjectType,
  ParsedSkylarkObjectImageRelationship,
  SkylarkGraphQLObjectImage,
  SkylarkObjectIdentifier,
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
  object,
  inEditMode,
  setPanelObject,
}: {
  src: string;
  title?: string;
  alt?: string;
  object: SkylarkObjectIdentifier;
  inEditMode: boolean;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
}) => {
  const { size } = useImageSize(src);
  return (
    <div className="mb-4 break-words">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="max-h-64" src={src} alt={title || alt || ""} />
      <div className="flex">
        <div className="mr-2 flex grow flex-col">
          {title && <p className="mt-1">Title: {title}</p>}
          <p>Original size: {size ? `${size.h}x${size.w}` : ""}</p>
        </div>
        <OpenObjectButton
          disabled={inEditMode}
          onClick={() => setPanelObject(object)}
        />
      </div>
    </div>
  );
};

export const PanelImages = ({
  images,
  isPage,
  inEditMode,
  setPanelObject,
}: {
  isPage?: boolean;
  images: ParsedSkylarkObjectImageRelationship[];
  inEditMode: boolean;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
}) => {
  return (
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
                      object={{
                        uid: image.uid,
                        objectType: BuiltInSkylarkObjectType.SkylarkImage,
                        language: image._meta?.language_data.language || "",
                      }}
                      inEditMode={inEditMode}
                      setPanelObject={setPanelObject}
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
