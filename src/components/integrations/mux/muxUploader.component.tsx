import MuxUploaderComponent from "@mux/mux-uploader-react";
import { CSSProperties, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { Select } from "src/components/inputs/select";
import { BaseIntegrationUploaderProps } from "src/components/integrations/common";
import { Modal } from "src/components/modals/base/modal";
import { Toast } from "src/components/toast/toast.component";
import { useGenerateMuxUploadUrl } from "src/hooks/integrations/useGenerateMuxUploadUrl";

interface MuxUploaderProps extends BaseIntegrationUploaderProps {
  id?: string;
}

export const MuxUploader = ({
  uid,
  objectType,
  relationshipName,
  id,
  playbackPolicy: propPlaybackPolicy,
  buttonProps,
  onSuccess,
}: MuxUploaderProps) => {
  const [playbackPolicy, setPlaybackPolicy] = useState<"signed" | "public">(
    propPlaybackPolicy || "public",
  );

  const { data, isLoading, isError } = useGenerateMuxUploadUrl({
    uid,
    objectType,
    relationshipName,
    playbackPolicy,
  });

  const [isOpen, setIsOpen] = useState(false);

  const onSuccessWrapper = () => {
    setIsOpen(false);
    onSuccess();
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
          title="Upload video to Mux"
          size="medium"
          closeModal={() => setIsOpen(false)}
        >
          <Select
            className="max-w-64"
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
                    onSuccess={onSuccessWrapper}
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
                    <Button variant="primary" className={""} slot="file-select">
                      Upload video
                    </Button>
                  </MuxUploaderComponent>
                )}
              </div>
            </div>
          </div>
        </Modal>
      </>
    </>
  );
};
