import { ButtonProps } from "src/components/button";

export type IntegrationUploadType = "image" | "video";

export type IntegrationUploaderProvider = "mux" | "cloudinary" | "bitmovin";

export interface IntegrationObjectInfo {
  uid: string;
  objectType: string;
  relationshipName?: string;
}

export interface BaseIntegrationUploaderProps extends IntegrationObjectInfo {
  buttonProps: Omit<ButtonProps, "onClick">;
  onSuccess: () => void;
}

export const createIntegrationServiceObj = ({
  uid,
  objectType,
  relationshipName,
}: IntegrationObjectInfo) => {
  return relationshipName
    ? {
        skylark_object_uid: uid,
        skylark_object_type: objectType,
        relationship_name: relationshipName,
      }
    : {
        skylark_object_uid: uid,
        skylark_object_type: objectType,
      };
};
