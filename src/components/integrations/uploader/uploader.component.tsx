import { sentenceCase } from "change-case";
import { toast } from "react-toastify";

import { CloudinaryUploader } from "src/components/integrations/cloudinary/cloudinaryUploader.component";
import {
  BaseIntegrationUploaderProps,
  IntegrationObjectInfo,
  IntegrationUploadType,
  IntegrationUploaderPlaybackPolicy,
  IntegrationUploaderProvider,
} from "src/components/integrations/common";
import { MuxUploader } from "src/components/integrations/mux/muxUploader.component";
import { Toast } from "src/components/toast/toast.component";

interface IntegrationUploaderProps {
  provider: IntegrationUploaderProvider;
  type: IntegrationUploadType;
  playbackPolicy: IntegrationUploaderPlaybackPolicy;
  opts: IntegrationObjectInfo;
  hideErrorForUnsupported?: boolean;
  onSuccess?: () => void;
  buttonProps: BaseIntegrationUploaderProps["buttonProps"];
  assetType?: string;
}

export const IntegrationUploader = ({
  provider,
  type,
  playbackPolicy,
  opts,
  buttonProps,
  hideErrorForUnsupported,
  assetType,
  onSuccess,
}: IntegrationUploaderProps) => {
  const onSuccessWrapper = () => {
    toast.success(
      <Toast
        title={"Upload Successful"}
        message={`${sentenceCase(provider)} is processing your ${type}...`}
      />,
    );
    onSuccess?.();
  };

  const commonProps = {
    provider,
    playbackPolicy,
    buttonProps,
    assetType,
    onSuccess: onSuccessWrapper,
  };

  if (provider === "mux" || provider === "brightcove") {
    return <MuxUploader {...opts} {...commonProps} />;
  }

  if (provider === "cloudinary") {
    return <CloudinaryUploader {...opts} {...commonProps} />;
  }

  return hideErrorForUnsupported ? (
    <></>
  ) : (
    <p>{`No uploader for provider "${provider}".`}</p>
  );
};
