import MuxUploaderComponent from "@mux/mux-uploader-react";
import { CSSProperties, useState } from "react";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { Modal } from "src/components/modals/base/modal";
import { Skeleton } from "src/components/skeleton";
import { Toast } from "src/components/toast/toast.component";
import { useGenerateMuxUploadUrl } from "src/hooks/integrations/useGenerateMuxUploadUrl";

interface MuxUploaderProps {
  uid: string;
  id?: string;
  onSuccess: () => void;
}

export const MuxUploader = ({ uid, id, onSuccess }: MuxUploaderProps) => {
  const { data, isLoading } = useGenerateMuxUploadUrl(uid);

  const [isOpen, setIsOpen] = useState(false);

  const onSuccessWrapper = () => {
    setIsOpen(false);
    onSuccess();
  };

  return (
    <>
      {data && (
        <>
          <Button variant="outline" onClick={() => setIsOpen(true)}>
            Open Mux Widget
          </Button>
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
      {isLoading && <Skeleton className="h-52 w-full" />}
    </>
  );
};
