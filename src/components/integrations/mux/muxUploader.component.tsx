import MuxUploaderComponent from "@mux/mux-uploader-react";
import { CSSProperties, useState } from "react";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
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
  buttonProps,
  onSuccess,
}: MuxUploaderProps) => {
  const { data, isLoading, isError } = useGenerateMuxUploadUrl({
    uid,
    objectType,
    relationshipName,
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
      {data && (
        <>
          <Modal
            isOpen={isOpen}
            title="Mux"
            size="medium"
            closeModal={() => setIsOpen(false)}
          >
            <div className="w-full h-full min-h-96 flex justify-center items-center text-black">
              <div className="bg-brand-primary/30 w-full h-52">
                <MuxUploaderComponent
                  endpoint={data.url}
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
                      "--overlay-background-color": "green",
                      fontSize: 14,
                    } as CSSProperties
                  }
                  onSuccess={onSuccessWrapper}
                  onError={(error) =>
                    toast.error(
                      <Toast
                        title="Cloudinary Upload Error"
                        message={JSON.stringify(error)}
                      />,
                      { autoClose: 20000 },
                    )
                  }
                />
              </div>
            </div>
          </Modal>
        </>
      )}
    </>
  );
};
