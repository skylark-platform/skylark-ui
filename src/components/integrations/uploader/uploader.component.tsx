import { toast } from "react-toastify";
import { sentenceCase } from "sentence-case";

import { ButtonProps } from "src/components/button";
import { BaseIntegrationUploaderProps } from "src/components/integrations/baseUploader.component";
import { BitmovinUploader } from "src/components/integrations/bitmovin/bitmovinUploader.component";
import { CloudinaryUploader } from "src/components/integrations/cloudinary/cloudinaryUploader.component";
import { MuxUploader } from "src/components/integrations/mux/muxUploader.component";
import { Toast } from "src/components/toast/toast.component";

export type IntegrationUploadType = "image" | "video";

export type IntegrationUploaderProvider = "mux" | "cloudinary" | "bitmovin";

export const IntegrationUploader = ({
  provider,
  type,
  opts,
  buttonProps,
  onSuccess,
}: {
  provider: IntegrationUploaderProvider;
  type: IntegrationUploadType;
  opts: { uid: string };
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
        buttonProps={buttonProps}
        uid={opts.uid}
        onSuccess={onSuccessWrapper}
      />
    );
  }

  if (provider === "cloudinary") {
    return (
      <CloudinaryUploader
        buttonProps={buttonProps}
        uid={opts.uid}
        onSuccess={onSuccessWrapper}
      />
    );
  }

  if (provider === "bitmovin") {
    return (
      <BitmovinUploader
        buttonProps={buttonProps}
        uid={opts.uid}
        onSuccess={onSuccessWrapper}
      />
    );
  }

  return <></>;
};
