import MuxUploaderComponent from "@mux/mux-uploader-react";
import { useQueryClient } from "@tanstack/react-query";
import { CSSProperties, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { SimpleFileUploader } from "src/components/inputs/fileUploader/fileUploader.component";
import { Select } from "src/components/inputs/select";
import { BaseIntegrationUploaderProps } from "src/components/integrations/common";
import { Modal } from "src/components/modals/base/modal";
import { Toast } from "src/components/toast/toast.component";
import {
  createIntegrationUploadQueryKeyBase,
  useGenerateIntegrationUploadUrl,
} from "src/hooks/integrations/useGenerateIntegrationUploadUrl";
import { useSignalIntegrationUploadComplete } from "src/hooks/integrations/useSignalIntegrationUploadComplete";
import { useSkylarkSchemaEnum } from "src/hooks/useSkylarkSchemaIntrospection";

interface MuxUploaderProps extends BaseIntegrationUploaderProps {
  id?: string;
}

export const MuxUploader = ({
  provider,
  uid,
  objectType,
  relationshipName,
  id,
  playbackPolicy: propPlaybackPolicy,
  buttonProps,
  assetType: propAssetType,
  onSuccess,
}: MuxUploaderProps) => {
  const queryClient = useQueryClient();

  const [playbackPolicy, setPlaybackPolicy] = useState<"signed" | "public">(
    propPlaybackPolicy || "public",
  );
  const [assetType, setAssetType] = useState(propAssetType || "");

  const { data, isLoading, isError } = useGenerateIntegrationUploadUrl(
    "video",
    provider,
    {
      uid,
      objectType,
      relationshipName,
      playbackPolicy,
    },
  );

  const { signalUploadComplete } = useSignalIntegrationUploadComplete({
    type: "video",
    provider,
    uid,
    objectType,
    relationshipName,
  });

  const [isOpen, setIsOpen] = useState(false);

  const { data: assetTypeEnum } = useSkylarkSchemaEnum("AssetType");
  const firstAssetTypeEnumValue =
    (assetTypeEnum?.values && assetTypeEnum?.values?.[0]) || "";

  const onSuccessWrapper = (filename?: string) => {
    setIsOpen(false);
    onSuccess();
    void queryClient.invalidateQueries({
      queryKey: createIntegrationUploadQueryKeyBase("video", provider),
    });

    if (data?.upload_id && provider === "brightcove") {
      signalUploadComplete({
        uploadId: data.upload_id,
        fileName: filename || "",
        assetType: assetType || firstAssetTypeEnumValue,
        playbackPolicy,
      });
    }
  };

  return (
    <>
      <Button
        loading={isLoading}
        {...buttonProps}
        disabled={buttonProps.disabled || isLoading || isError}
        onClick={() => setIsOpen(true)}
      />
      <>
        <Modal
          isOpen={isOpen}
          title={`Upload video to ${provider === "brightcove" ? "Brightcove" : "Mux"}`}
          size="medium"
          closeModal={() => setIsOpen(false)}
        >
          <div className="flex w-full gap-4">
            <Select
              className="max-w-64 w-full"
              label="Playback type"
              labelVariant="form"
              searchable={false}
              variant="primary"
              placeholder=""
              options={[
                { label: "Public", value: "public" },
                { label: "Signed", value: "signed" },
              ]}
              selected={playbackPolicy}
              onChange={setPlaybackPolicy}
            />
            {provider === "brightcove" && (
              <Select
                className="max-w-64 w-full"
                label="Asset type"
                labelVariant="form"
                searchable={false}
                variant="primary"
                placeholder=""
                disabled={!assetTypeEnum?.values}
                options={
                  assetTypeEnum?.values?.map((value) => ({
                    label: value,
                    value,
                  })) || []
                }
                selected={assetType || firstAssetTypeEnumValue}
                onChange={setAssetType}
              />
            )}
          </div>

          <div className="w-full h-full min-h-64 text-black">
            <div className="flex justify-center items-center mt-4">
              <div className="w-full h-full">
                {isLoading && (
                  <div className="w-full flex h-full">
                    <CgSpinner className="mr-1 animate-spin-fast text-base md:text-lg" />
                    <p className="">Generating upload URL</p>
                  </div>
                )}
                {data && (
                  <>
                    {provider === "mux" ? (
                      <MuxUploaderComponent
                        endpoint={data.url}
                        dynamicChunkSize
                        id={id}
                        style={
                          {
                            // Commented out ones didn't work
                            "--uploader-font-family": "Inter",
                            // "--uploader-font-size": "",
                            // "--uploader-background-color": "blue",
                            // "--button-background-color": "#226DFF",
                            // "--button-border": "",
                            // "--button-border-radius": "",
                            // "--button-padding": "",
                            // "--button-hover-text": "",
                            // "--button-hover-background": "#226DFF",
                            // "--button-active-text": "",
                            // "--button-active-background": "#226DFF",
                            // "--progress-bar-fill-color": "",
                            // "--progress-radial-fill-color": "",
                            // "--overlay-background-color": "green",
                            fontSize: 14,
                          } as CSSProperties
                        }
                        onSuccess={() => onSuccessWrapper()}
                        onUploadError={(err) =>
                          toast.error(
                            <Toast
                              title="Mux Upload Error"
                              message={[err.detail.message]}
                            />,
                            { autoClose: 20000 },
                          )
                        }
                        onError={(error) =>
                          toast.error(
                            <Toast
                              title="Mux Upload Error"
                              message={JSON.stringify(error)}
                            />,
                            { autoClose: 20000 },
                          )
                        }
                      >
                        <Button
                          variant="primary"
                          className={""}
                          slot="file-select"
                        >
                          Upload video
                        </Button>
                      </MuxUploaderComponent>
                    ) : (
                      <SimpleFileUploader
                        uploadUrl={data.url}
                        onSuccess={onSuccessWrapper}
                      />
                    )}
                    {/* <SimpleFileUploader
                      uploadUrl={data.url}
                      onSuccess={onSuccessWrapper}
                    /> */}
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      </>
    </>
  );
};
