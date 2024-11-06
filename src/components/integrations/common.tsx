import { ButtonProps } from "src/components/button";

export type IntegrationUploadType = "image" | "video";

export type IntegrationUploaderProvider =
  | "mux"
  | "cloudinary"
  | "brightcove"
  | "wowza";

export type IntegrationUploaderPlaybackPolicy = "signed" | "public" | undefined;

export interface IntegrationObjectInfo {
  uid: string;
  objectType: string;
  relationshipName?: string;
}

export interface BaseIntegrationUploaderProps extends IntegrationObjectInfo {
  provider: IntegrationUploaderProvider;
  buttonProps: Omit<ButtonProps, "onClick">;
  playbackPolicy: IntegrationUploaderPlaybackPolicy;
  assetType?: string;
  onSuccess: () => void;
}

export const supportedIntegrations: Record<
  IntegrationUploadType,
  Record<IntegrationUploaderProvider, boolean>
> = {
  image: {
    cloudinary: true,
    mux: false,
    brightcove: false,
    wowza: false,
  },
  video: {
    mux: true,
    cloudinary: true,
    brightcove: true,
    wowza: true,
  },
};

export const createIntegrationServiceObj = (
  { uid, objectType, relationshipName }: IntegrationObjectInfo,
  playbackPolicy?: IntegrationUploaderPlaybackPolicy,
) => {
  return relationshipName
    ? {
        skylark_object_uid: uid,
        skylark_object_type: objectType,
        relationship_name: relationshipName,
        playback_policy: playbackPolicy || "unsigned",
      }
    : {
        skylark_object_uid: uid,
        skylark_object_type: objectType,
        playback_policy: playbackPolicy || "unsigned",
      };
};
