import MuxUploaderComponent from "@mux/mux-uploader-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CSSProperties, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { Select } from "src/components/inputs/select";
import { TextInput } from "src/components/inputs/textInput";
import {
  BaseIntegrationUploaderProps,
  createIntegrationServiceObj,
} from "src/components/integrations/common";
import { Modal } from "src/components/modals/base/modal";
import { Toast } from "src/components/toast/toast.component";
import {
  createIntegrationUploadQueryKeyBase,
  useGenerateIntegrationUploadUrl,
} from "src/hooks/integrations/useGenerateIntegrationUploadUrl";
import { integrationServiceRequest } from "src/lib/integrationService/client";

interface WowzaUploaderProps extends BaseIntegrationUploaderProps {
  id?: string;
}

export const WowzaUploader = ({
  uid,
  objectType,
  relationshipName,
  id,
  playbackPolicy: propPlaybackPolicy,
  buttonProps,
  onSuccess,
}: WowzaUploaderProps) => {
  const queryClient = useQueryClient();

  const [playbackPolicy, setPlaybackPolicy] = useState<"signed" | "public">(
    propPlaybackPolicy || "public",
  );

  const { data, isLoading, isError } = useGenerateIntegrationUploadUrl(
    "video",
    "wowza",
    {
      uid,
      objectType,
      relationshipName,
      playbackPolicy,
    },
  );

  const [isOpen, setIsOpen] = useState(false);

  const onSuccessWrapper = () => {
    setIsOpen(false);
    onSuccess();
    void queryClient.invalidateQueries({
      queryKey: createIntegrationUploadQueryKeyBase("video", "wowza"),
    });
  };

  const [value, setValue] = useState("");

  const { mutate } = useMutation({
    mutationFn: async (fetchUrl: string) => {
      const data = await integrationServiceRequest(`/upload-url/video/wowza`, {
        body: {
          ...createIntegrationServiceObj({
            uid,
            objectType,
            relationshipName,
          }),
          method: "fetch",
          fetch_url: fetchUrl,
        },
        method: "POST",
      });
      console.log({ data });
      return data;
    },
    onSuccess: onSuccessWrapper,
  });

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
          title="Upload video to Wowza"
          size="medium"
          closeModal={() => setIsOpen(false)}
        >
          <div className="mt-2">
            <TextInput
              className="mb-4"
              value={value}
              onChange={setValue}
              label="External URL"
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                className={""}
                onClick={() => mutate(value)}
              >
                Upload video
              </Button>
            </div>
          </div>
        </Modal>
      </>
    </>
  );
};
