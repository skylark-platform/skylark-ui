import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Fragment, useState } from "react";
import { FiUploadCloud } from "react-icons/fi";

import { Select, SelectOption } from "src/components/inputs/select";
import {
  IntegrationUploader,
  IntegrationUploaderPlaybackPolicy,
  IntegrationUploaderProvider,
} from "src/components/integrations";
import { DisplayGraphQLQuery } from "src/components/modals";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { pollPanelRefetch } from "src/components/panel/panel.lib";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { VideoPlayer } from "src/components/players";
import { Skeleton } from "src/components/skeleton";
import { useGenerateIntegrationPlaybackUrl } from "src/hooks/integrations/useGenerateIntegrationPlaybackUrl";
import { useGetIntegrations } from "src/hooks/integrations/useGetIntegrations";
import { useGetObjectRelationships } from "src/hooks/objects/get/useGetObjectRelationships";
import { PanelTab } from "src/hooks/state";
import {
  BuiltInSkylarkObjectType,
  SkylarkObjectIdentifier,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";
import { formatObjectField, hasProperty } from "src/lib/utils";

import { PanelMetadataProperty } from "./panelMetadataAdditionalSections";
import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelPlaybackProps {
  uid: string;
  objectType: string;
  language: string;
  isPage?: boolean;
  inEditMode: boolean;
  objectMeta: SkylarkObjectMeta | null;
  metadata: Record<string, SkylarkObjectMetadataField> | null;
  setPanelObject: (o: SkylarkObjectIdentifier, tab?: PanelTab) => void;
}

const videoTypes = ["hls", "dash", "external"];

const getPlaybackPolicyFromMetadata = (
  metadata: PanelPlaybackProps["metadata"],
): IntegrationUploaderPlaybackPolicy => {
  const policyField = metadata?.["policy"];

  if (!metadata || !policyField || typeof policyField !== "string") {
    return;
  }

  const lowercasedPolicyField = policyField.toLocaleLowerCase();

  if (
    lowercasedPolicyField !== "signed" &&
    lowercasedPolicyField !== "public"
  ) {
    return;
  }

  return lowercasedPolicyField;
};

const getVideoTypeSections = (
  metadata: PanelPlaybackProps["metadata"],
  includeEmptySections?: boolean,
): {
  type: string;
  id: string;
  htmlId: string;
  title: string;
  properties: {
    key: string;
    property: string;
    value: SkylarkObjectMetadataField;
    isUrl: boolean;
  }[];
  url: SkylarkObjectMetadataField;
  playbackId: string | null;
}[] => {
  const sections = videoTypes
    .map((videoType) => {
      if (videoType === "external") {
        const url =
          hasProperty(metadata, "url") && typeof metadata.url === "string"
            ? metadata["url"]
            : "";
        return {
          type: videoType,
          htmlId: `playback-panel-external`,
          id: videoType,
          title: videoType.toUpperCase(),
          properties: url
            ? [{ key: "url", property: "URL", isUrl: true, value: url }]
            : [],
          url,
          playbackId: null,
        };
      }

      const idKey = `${videoType}_id`;
      const urlKey = `${videoType}_url`;
      const dashboardKey = `${videoType}_dashboard`;

      const idProperty = metadata?.[idKey];
      const urlProperty = metadata?.[urlKey];
      const dashboardProperty = metadata?.[dashboardKey];

      const properties = [
        { key: idKey, property: "ID", isUrl: false, value: idProperty },
        { key: urlKey, property: "URL", isUrl: true, value: urlProperty },
        {
          key: dashboardKey,
          property: "Dashboard",
          isUrl: true,
          value: dashboardProperty,
        },
      ].filter(
        (
          obj,
        ): obj is {
          key: string;
          property: string;
          value: SkylarkObjectMetadataField;
          isUrl: boolean;
        } => hasProperty(metadata, obj.key) && metadata[obj.key] !== null,
      );

      return {
        type: videoType,
        id: videoType,
        htmlId: `playback-panel-${videoType}`,
        title: videoType.toUpperCase(),
        properties,
        playbackId: hasProperty(metadata, idKey)
          ? (metadata[idKey] as string)
          : null,
        url: hasProperty(metadata, urlKey) && metadata[urlKey],
      };
    })
    .filter(({ properties }) => properties.length > 0 || includeEmptySections);

  return sections;
};

const PreviewVideo = ({
  url: publicUrl,
  provider,
  playbackId,
  playbackPolicy,
  className: propClassName,
}: {
  url: SkylarkObjectMetadataField;
  provider: IntegrationUploaderProvider | null;
  playbackPolicy: IntegrationUploaderPlaybackPolicy;
  playbackId: string | null;
  className?: string;
}) => {
  const { signedPlaybackUrl, isLoading } = useGenerateIntegrationPlaybackUrl(
    provider,
    playbackPolicy,
    playbackId,
  );

  const className = clsx(
    "h-full w-full bg-black object-cover object-center max-w-xl",
    propClassName,
  );

  return (
    <>
      {publicUrl &&
        (playbackPolicy === "public" ||
          !playbackId ||
          (!signedPlaybackUrl && !isLoading)) && (
          <VideoPlayer src={publicUrl as string} className={className} />
        )}
      {signedPlaybackUrl && playbackPolicy !== "public" && (
        <VideoPlayer src={signedPlaybackUrl} className={className} />
      )}
    </>
  );
};

const MetadataPlayback = ({
  uid,
  objectType,
  metadata,
  isPage,
}: Omit<PanelPlaybackProps, "metadata"> & {
  metadata: Record<string, SkylarkObjectMetadataField>;
}) => {
  const queryClient = useQueryClient();

  const sections = getVideoTypeSections(metadata, true);
  const { data } = useGetIntegrations("video");

  const options =
    data?.enabledIntegrations.map(
      (name): SelectOption<IntegrationUploaderProvider> => ({
        label: name,
        value: name,
      }),
    ) || [];

  const [selected, setSelected] = useState<IntegrationUploaderProvider | null>(
    null,
  );
  const provider = selected || data?.enabledIntegrations?.[0];

  const uploadSection = {
    id: "video-upload",
    htmlId: "video-upload",
    title: "Upload",
  };

  return (
    <PanelSectionLayout sections={[uploadSection, ...sections]} isPage={isPage}>
      <PanelSectionTitle text={"Upload"} id={uploadSection.id} />
      <div className="mb-8">
        {data?.enabledIntegrations && data?.enabledIntegrations.length >= 2 && (
          <Select
            options={options}
            selected={provider}
            onChange={setSelected}
            className="mb-4"
            variant="primary"
            placeholder="Select Provider"
          />
        )}
        {provider && (
          <div>
            <IntegrationUploader
              provider={provider}
              type={"video"}
              playbackPolicy={
                data?.integrations?.[provider]?.custom?.default_playback_policy
              }
              opts={{ uid, objectType }}
              buttonProps={{
                variant: "outline",
                children: "Upload",
                Icon: <FiUploadCloud className="text-lg" />,
              }}
              onSuccess={() => {
                pollPanelRefetch(queryClient);
              }}
            />
          </div>
        )}
      </div>
      {sections.map(({ id, type, properties, url, playbackId }) => {
        return (
          <div key={id} className="relative mb-8">
            <PanelSectionTitle text={type.toUpperCase()} id={id} />
            {properties.map(({ key, property, isUrl, value }) => (
              <PanelMetadataProperty
                key={key}
                property={property}
                value={value}
                sanitiseText={false}
                isUrl={isUrl}
              />
            ))}
            {properties.length === 0 && <PanelEmptyDataText />}
            {url && (
              <PreviewVideo
                url={url}
                className="mb-4"
                playbackId={playbackId}
                provider={provider || null}
                playbackPolicy={getPlaybackPolicyFromMetadata(metadata)}
              />
            )}
          </div>
        );
      })}
    </PanelSectionLayout>
  );
};

const RelationshipPlayback = ({
  uid,
  objectType,
  language,
  isPage,
  metadata,
  setPanelObject,
}: PanelPlaybackProps) => {
  const queryClient = useQueryClient();

  const { relationships, isLoading, query, variables } =
    useGetObjectRelationships(objectType, uid, { language });

  const relationshipsArr = relationships ? Object.values(relationships) : [];

  const assetRelationships =
    relationshipsArr?.filter(
      (rel) => rel.objectType === BuiltInSkylarkObjectType.SkylarkAsset,
    ) || [];
  const liveAssetRelationships =
    relationshipsArr?.filter(
      (rel) => rel.objectType === BuiltInSkylarkObjectType.SkylarkLiveAsset,
    ) || [];

  const sections = [...assetRelationships, ...liveAssetRelationships]
    .sort((a, b) => (a.objects.length > b.objects.length ? -1 : 1))
    .map(({ objects, name }) => ({
      id: name,
      htmlId: `playback-panel-${name}`,
      title: formatObjectField(name),
      relationshipName: name,
      objects: objects,
      isLive: liveAssetRelationships.findIndex((rel) => rel.name === name) > -1,
    }));

  const { data, isLoading: isLoadingIntegrations } =
    useGetIntegrations("video");

  const firstActiveProvider = data?.enabledIntegrations?.[0];

  return (
    <PanelSectionLayout sections={sections} isPage={isPage}>
      {sections.map(({ id, title, objects, isLive, relationshipName }) => {
        return (
          <div key={id} className="relative mb-8">
            <PanelSectionTitle
              text={title}
              id={id}
              loading={isLoadingIntegrations}
            >
              {!isLive && data && firstActiveProvider && (
                <IntegrationUploader
                  provider={firstActiveProvider}
                  type={"video"}
                  playbackPolicy={
                    data?.integrations?.[firstActiveProvider]?.custom
                      ?.default_playback_policy
                  }
                  opts={{ uid, relationshipName, objectType }}
                  hideErrorForUnsupported
                  buttonProps={{
                    variant: "form-ghost",
                    className: "ml-2",
                    Icon: <FiUploadCloud className="text-lg" />,
                    "aria-label": `Upload video to ${relationshipName}`,
                  }}
                  onSuccess={() => {
                    pollPanelRefetch(queryClient);
                  }}
                />
              )}
            </PanelSectionTitle>
            {objects.length > 0 ? (
              objects.map((object) => {
                const sections = getVideoTypeSections(object.metadata, false);

                return (
                  <Fragment key={uid}>
                    {sections.map(({ url, id, playbackId }) => (
                      <div key={id} className="mb-4">
                        <PreviewVideo
                          url={url}
                          provider={firstActiveProvider || null}
                          playbackId={playbackId}
                          playbackPolicy={getPlaybackPolicyFromMetadata(
                            object.metadata,
                          )}
                        />
                        <ObjectIdentifierCard
                          hideObjectType
                          className="max-w-xl"
                          object={object}
                          onForwardClick={(obj) =>
                            setPanelObject(obj, PanelTab.Playback)
                          }
                        />
                      </div>
                    ))}
                  </Fragment>
                );
              })
            ) : (
              <PanelEmptyDataText />
            )}
          </div>
        );
      })}
      <PanelLoading isLoading={isLoading}>
        <Skeleton className="mb-4 h-6 w-52" />
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

export const PanelPlayback = (props: PanelPlaybackProps) => {
  const isAssetObjectType =
    props.objectType === BuiltInSkylarkObjectType.SkylarkAsset ||
    props.objectType === BuiltInSkylarkObjectType.SkylarkLiveAsset;

  return (
    <>
      {isAssetObjectType && props.metadata && (
        <MetadataPlayback {...props} metadata={props.metadata} />
      )}
      {!isAssetObjectType && <RelationshipPlayback {...props} />}
    </>
  );
};
