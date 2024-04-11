import BitmovinApi, {
  BitmovinError,
  InputType,
  StreamsVideoCreateRequest,
  StreamsVideoResponse,
} from "@bitmovin/api-sdk";
import axios, { AxiosProgressEvent } from "axios";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import { Button } from "src/components/button";
import { BaseIntegrationUploaderProps } from "src/components/integrations/baseUploader.component";
import { Modal } from "src/components/modals/base/modal";
import { Skeleton } from "src/components/skeleton";
import { useGenerateMuxUploadUrl } from "src/hooks/integrations/useGenerateMuxUploadUrl";

interface BitmovinUploaderProps extends BaseIntegrationUploaderProps {
  uid: string;
}

interface BitmovingUploaderWidgetProps extends BitmovinUploaderProps {
  apiKey: string;
}

enum UploadStatus {
  IDLE,
  UPLOADING,
  UPLOADED,
  ERROR,
}

const BitmovinUploaderWidget = ({
  apiKey,
  onSuccess,
}: BitmovingUploaderWidgetProps) => {
  const [bitmovinApi, setBitmovinApi] = useState<BitmovinApi>();
  const [isDragging, setIsDragging] = useState(false);
  const [stream, setStream] = useState<StreamsVideoResponse>();
  const [uploadProgress, setUploadProgress] = useState<number>();
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<UploadStatus>(UploadStatus.IDLE);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Create a Bitmovin API client instance
  useEffect(() => {
    setBitmovinApi(new BitmovinApi({ apiKey }));
  }, [apiKey]);

  const handleFileDroppedOrSelected = async (file: File) => {
    try {
      // Create a direct file upload input
      // The response object contains the input ID and the URL to upload the file to
      const input = await bitmovinApi?.encoding.inputs.directFileUpload.create({
        type: InputType.DIRECT_FILE_UPLOAD,
        name: "file-upload-example",
      });

      if (!input?.uploadUrl) {
        console.log("NO UPLOAD URL", input);
        return;
      }

      // Upload the file to the URL returned by the API
      // Note that we do not handle the response here, as we will use the input ID returned above to create a stream later
      await uploadFile(file, input?.uploadUrl);

      // Now that the file is uploaded, we can create a stream
      // The assetUrl is the URL to the file on the Bitmovin CDN and can be constructed like this:
      const assetUrl = `https://api.bitmovin.com/v1/encoding/inputs/direct-file-upload/${input?.id}`;
      const requestParams: StreamsVideoCreateRequest = {
        assetUrl,
        title: "File Upload Example",
      };
      const stream = await bitmovinApi?.streams.video.create(requestParams);

      // Stream is now created and ready to be used
      setStream(stream);
    } catch (e) {
      setStatus(UploadStatus.ERROR);
      e instanceof BitmovinError
        ? setError(e.shortMessage)
        : setError("Something went wrong.");
    }
  };

  const onFileSelected = (evt: React.FormEvent<HTMLInputElement>) => {
    const target = evt.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0) {
      handleFileDroppedOrSelected(target.files[0]);
    }
  };

  // Upload the file to the URL returned by the API
  // We use Axios here instead of fetch to track the upload progress
  // Alternatively you could also use plain XMLHttpRequest
  const uploadFile = async (file: File, uploadUrl: string) => {
    setStatus(UploadStatus.UPLOADING);

    // Note that we use a PUT request here for the upload
    return axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress,
    });
  };

  // Track the upload progress
  const onUploadProgress = (progressEvent: AxiosProgressEvent) => {
    const { loaded, total } = progressEvent;
    const percent = Math.floor((loaded * 100) / total!);
    setUploadProgress(percent);

    if (percent === 100) {
      setStatus(UploadStatus.UPLOADED);
      onSuccess();
    }
  };

  // Event handlers for drag and drop
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileDroppedOrSelected(e.dataTransfer.files[0]);
  };

  // Reset the state of the component
  const reset = () => {
    setStatus(UploadStatus.IDLE);
    setUploadProgress(undefined);
    setStream(undefined);
    setError(undefined);
  };

  const renderIdleState = () => {
    return (
      <>
        <label htmlFor="upload-input">
          <p>Drag and drop a file here or click to select a file</p>
          <p>
            <button onClick={() => uploadInputRef.current?.click()}>
              Choose a file
            </button>
          </p>
        </label>
        <input
          type="file"
          id="upload-input"
          style={{ display: "none" }}
          ref={uploadInputRef}
          onChange={onFileSelected}
        />
      </>
    );
  };

  const renderUploadingState = () => {
    return (
      <div>
        <p>Uploading...</p>
        <p>{`${uploadProgress}%`}</p>
      </div>
    );
  };

  const renderUploadedState = () => {
    if (!stream) {
      return (
        <div>
          <p>Creating your Stream...</p>
        </div>
      );
    }

    return (
      <div>
        <p>{`New Stream created with id ${stream.id}`}</p>
        <p>
          <a
            href={`https://streams.bitmovin.com/${stream.id}/embed`}
            target="_blank"
          >
            Check it out!
          </a>
        </p>
        <p>
          <button onClick={reset}>Reset</button>
        </p>
      </div>
    );
  };

  const renderErrorState = () => {
    return (
      <div className="text-error">
        <p>{error}</p>
        <button onClick={reset}>Reset</button>
      </div>
    );
  };

  const renderContent = () => {
    switch (status) {
      case UploadStatus.IDLE:
        return renderIdleState();
      case UploadStatus.UPLOADING:
        return renderUploadingState();
      case UploadStatus.UPLOADED:
        return renderUploadedState();
      case UploadStatus.ERROR:
        return renderErrorState();
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={clsx(
        "w-96 border-2 border-dashed border-black rounded p-20 text-center",
        isDragging && "border-brand-primary",
        status === UploadStatus.ERROR && "border-error",
      )}
    >
      {renderContent()}
    </div>
  );
};

export const BitmovinUploader = ({
  uid,
  objectType,
  relationshipName,
  buttonProps,
  onSuccess,
}: BitmovinUploaderProps) => {
  const { data, isLoading } = useGenerateMuxUploadUrl({
    uid,
    objectType,
    relationshipName,
  });

  const apiKey = "";

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
        disabled={buttonProps.disabled || isLoading}
        onClick={() => setIsOpen(true)}
      />
      {data && (
        <>
          <Modal
            isOpen={isOpen}
            title="Bitmovin"
            size="medium"
            closeModal={() => setIsOpen(false)}
          >
            <div className="w-full h-full min-h-96 flex justify-center items-center text-black">
              <BitmovinUploaderWidget
                uid={uid}
                objectType={objectType}
                relationshipName={relationshipName}
                apiKey={apiKey}
                buttonProps={buttonProps}
                onSuccess={onSuccessWrapper}
              />
            </div>
          </Modal>
        </>
      )}
    </>
  );
};
