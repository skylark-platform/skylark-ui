import { ButtonProps } from "src/components/button";

export type IntegrationUploadType = "image" | "video";

export type IntegrationUploaderProvider = "mux" | "cloudinary" | "wowza";

export type IntegrationUploaderPlaybackPolicy = "signed" | "public" | undefined;

export interface IntegrationObjectInfo {
  uid: string;
  objectType: string;
  relationshipName?: string;
}

export interface BaseIntegrationUploaderProps extends IntegrationObjectInfo {
  buttonProps: Omit<ButtonProps, "onClick">;
  playbackPolicy: IntegrationUploaderPlaybackPolicy;
  onSuccess: () => void;
}

export const supportedIntegrations: Record<
  IntegrationUploadType,
  Record<IntegrationUploaderProvider, boolean>
> = {
  image: {
    cloudinary: true,
    mux: false,
    wowza: false,
  },
  video: {
    mux: true,
    wowza: true,
    cloudinary: true,
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
