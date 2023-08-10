import { PanelSectionTitle } from "src/components/panel/panelTypography";
import { VideoPlayer } from "src/components/players";
import {
  SkylarkObjectIdentifier,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";
import { hasProperty } from "src/lib/utils";

import { PanelMetadataProperty } from "./panelMetadataAdditionalSections";
import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelPlaybackProps {
  isPage?: boolean;
  inEditMode: boolean;
  metadata: Record<string, SkylarkObjectMetadataField> | null;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
}

const videoTypes = ["hls", "dash"];

export const PanelPlayback = ({ metadata, isPage }: PanelPlaybackProps) => {
  return (
    <PanelSectionLayout
      sections={videoTypes.map((type) => ({
        id: `playback-panel-${type}`,
        title: type.toUpperCase(),
      }))}
      isPage={isPage}
    >
      {videoTypes.map((type) => {
        const idKey = `${type}_id`;
        const urlKey = `${type}_url`;
        const dashboardKey = `${type}_dashboard`;

        return (
          <div key={`playback-panel-${type}`} className="relative mb-8">
            <PanelSectionTitle
              text={type.toUpperCase()}
              id={`playback-panel-${type}`}
            />
            <PanelMetadataProperty
              property="ID"
              value={hasProperty(metadata, idKey) && metadata[idKey]}
              sanitiseText={false}
            />
            <PanelMetadataProperty
              property="URL"
              value={hasProperty(metadata, urlKey) && metadata[urlKey]}
              sanitiseText={false}
              isUrl
            />
            <PanelMetadataProperty
              property="Dashboard"
              value={
                hasProperty(metadata, dashboardKey) && metadata[dashboardKey]
              }
              sanitiseText={false}
              isUrl
            />
            <VideoPlayer
              src={
                hasProperty(metadata, urlKey)
                  ? (metadata[urlKey] as string)
                  : ""
              }
              className="mb-4 h-full w-full bg-black object-cover object-center"
            />
          </div>
        );
      })}
    </PanelSectionLayout>
  );
};
