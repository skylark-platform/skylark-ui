import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { FiUploadCloud } from "react-icons/fi";

import { IntegrationUploader } from "src/components/integrations/uploader/uploader.component";
import { DisplayGraphQLQuery } from "src/components/modals";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { pollPanelRefetch } from "src/components/panel/panel.lib";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { useGetIntegrations } from "src/hooks/integrations/useGetIntegrations";
import { useGetObjectRelationships } from "src/hooks/objects/get/useGetObjectRelationships";
import { SetPanelObject } from "src/hooks/state";
import { useImageSize } from "src/hooks/useImageSize";
import {
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import {
  addCloudinaryOnTheFlyImageTransformation,
  formatObjectField,
  getObjectDisplayName,
  hasProperty,
} from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelImagesProps {
  uid: string;
  objectType: string;
  language: string;
  isPage?: boolean;
  inEditMode: boolean;
  setPanelObject: SetPanelObject;
}

const groupImagesByType = (images: ParsedSkylarkObject[]) => {
  return images.reduce(
    (acc: { [key: string]: ParsedSkylarkObject[] }, currentValue) => {
      const key =
        hasProperty<ParsedSkylarkObject["metadata"], "type", string>(
          currentValue.metadata,
          "type",
        ) && currentValue.metadata.type
          ? currentValue.metadata.type
          : "No type set";

      if (acc && acc[key])
        return {
          ...acc,
          [key]: [...acc[key], currentValue],
        };
      return {
        ...acc,
        [key]: [currentValue],
      };
    },
    {},
  );
};

const PanelImage = ({
  object,
  setPanelObject,
}: {
  object: ParsedSkylarkObject;
  inEditMode: boolean;
  setPanelObject: SetPanelObject;
}) => {
  const { displayName, src } = useMemo(() => {
    const displayName = getObjectDisplayName(object);

    const src =
      hasProperty(object.metadata, "url") &&
      typeof object.metadata.url === "string"
        ? object.metadata.url
        : "";

    return { displayName, src };
  }, [object]);

  const { size } = useImageSize(src);

  return (
    <div className="mb-4 break-words">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="max-h-64"
        src={addCloudinaryOnTheFlyImageTransformation(src, {})}
        alt={displayName}
      />
      <ObjectIdentifierCard
        hideObjectType
        className="max-w-xl"
        object={object}
        onForwardClick={setPanelObject}
      >
        <span className="text-manatee-500 text-sm">
          {size ? `(${size.h}x${size.w})` : ""}
        </span>
      </ObjectIdentifierCard>
    </div>
  );
};

export const PanelImages = ({
  uid,
  objectType,
  language,
  isPage,
  inEditMode,
  setPanelObject,
}: PanelImagesProps) => {
  const queryClient = useQueryClient();

  const { relationships, isLoading, query, variables } =
    useGetObjectRelationships(objectType, uid, { language });

  const { data, isLoading: isLoadingIntegrations } =
    useGetIntegrations("image");

  const images = relationships
    ? Object.values(relationships)?.filter(
        (rel) => rel.objectType === BuiltInSkylarkObjectType.SkylarkImage,
      )
    : [];

  return (
    <PanelSectionLayout
      sections={images.map(({ name }) => ({
        id: name,
        htmlId: `image-panel-${name}`,
        title: formatObjectField(name),
      }))}
      isPage={isPage}
      withStickyHeaders
    >
      {images.map(({ name: relationshipName, objects }) => {
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
              loading={isLoadingIntegrations}
            >
              {data && data.enabledIntegrations.length > 0 && (
                <IntegrationUploader
                  provider={data?.enabledIntegrations?.[0]}
                  playbackPolicy="public"
                  type={"image"}
                  opts={{ uid, relationshipName, objectType }}
                  buttonProps={{
                    variant: "form-ghost",
                    className: "ml-2",
                    Icon: <FiUploadCloud className="text-lg" />,
                    "aria-label": `Upload to ${relationshipName}`,
                  }}
                  onSuccess={() => {
                    pollPanelRefetch(queryClient, objectType, uid);
                  }}
                />
              )}
            </PanelSectionTitle>
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
                  {imagesGroupedByType[type].map((object) => (
                    <PanelImage
                      key={object.uid}
                      object={object}
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
      <PanelLoading isLoading={isLoading}>
        <Skeleton className="mb-4 h-6 w-52 mt-4 md:mt-8" />
        {Array.from({ length: 2 }, (_, i) => (
          <div key={`content-of-skeleton-${i}`} className="mb-8">
            <Skeleton className="mb-2 h-40 w-full max-w-xl" />
            <Skeleton className="mb-2 h-11 w-full max-w-xl" />
          </div>
        ))}
      </PanelLoading>
      <DisplayGraphQLQuery
        label="Get Object Relationships"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
    </PanelSectionLayout>
  );
};
