import { toast } from "react-toastify";
import { sentenceCase } from "sentence-case";

import {
  BaseIntegrationUploaderProps,
  IntegrationObjectInfo,
  IntegrationUploadType,
  IntegrationUploaderProvider,
} from "src/components/integrations/baseUploader.component";
import { BitmovinUploader } from "src/components/integrations/bitmovin/bitmovinUploader.component";
import { CloudinaryUploader } from "src/components/integrations/cloudinary/cloudinaryUploader.component";
import { MuxUploader } from "src/components/integrations/mux/muxUploader.component";
import { Toast } from "src/components/toast/toast.component";

export const IntegrationUploader = ({
  provider,
  type,
  opts,
  buttonProps,
  onSuccess,
}: {
  provider: IntegrationUploaderProvider;
  type: IntegrationUploadType;
  opts: IntegrationObjectInfo;
  onSuccess?: () => void;
} & { buttonProps: BaseIntegrationUploaderProps["buttonProps"] }) => {
  const onSuccessWrapper = () => {
    toast.success(
      <Toast
        title={"Upload Successful"}
        message={`${sentenceCase(provider)} is processing your ${type}...`}
      />,
    );
    onSuccess?.();
  };

  if (provider === "mux") {
    return (
      <MuxUploader
        {...opts}
        buttonProps={buttonProps}
        onSuccess={onSuccessWrapper}
      />
    );
  }

  if (provider === "cloudinary") {
    return (
      <CloudinaryUploader
        {...opts}
        buttonProps={buttonProps}
        onSuccess={onSuccessWrapper}
      />
    );
  }

  if (provider === "bitmovin") {
    return (
      <BitmovinUploader
        {...opts}
        buttonProps={buttonProps}
        onSuccess={onSuccessWrapper}
      />
    );
  }

  return <></>;
};
