import MuxUploaderComponent from "@mux/mux-uploader-react";
import { CSSProperties } from "react";

import { Skeleton } from "src/components/skeleton";
import { useGenerateMuxUploadUrl } from "src/hooks/integrations/useGenerateMuxUploadUrl";

interface MuxUploaderProps {
  uid: string;
  id?: string;
}

export const MuxUploader = ({ uid, id }: MuxUploaderProps) => {
  const { data, isLoading } = useGenerateMuxUploadUrl(uid);

  return (
    <>
      {data && (
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
          onSuccess={console.log}
          onError={console.log}
        />
      )}
      {isLoading && <Skeleton className="h-52 w-full" />}
    </>
  );
};
