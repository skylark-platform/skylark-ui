import { createContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { Skeleton } from "src/components/skeleton";
import { Toast } from "src/components/toast/toast.component";
import { useGenerateCloudinaryUploadUrl } from "src/hooks/integrations/useGenerateCloudinaryUploadUrl";
import { hasProperty, isObject } from "src/lib/utils";

interface CloudinaryContext {
  loaded: boolean;
}

interface CloudinaryUploaderProps {
  uid: string;
}

interface CloudinaryUploadWidgetProps {
  uid: string;
  cloudName: string;
  custom: Record<string, unknown>;
}

type CloudinaryWidget = {
  createUploadWidget: (
    uwConfig: {
      cloudName: string;
    },
    cb: (
      error: { status: string; statusText: string },
      result: {
        event: "success" | string;
      },
    ) => void,
  ) => { open: () => void };
};

// Create a context to manage the script loading state
const CloudinaryScriptContext = createContext<CloudinaryContext>({
  loaded: false,
});

export const CloudinaryUploadWidget = ({
  uid,
  cloudName,
  custom,
}: CloudinaryUploadWidgetProps) => {
  // TODO Need to document these presets as they can be passed in as parameters
  //
  // const [uwConfig] = useState({
  //   cloudName: "",
  //   uploadPreset: "mfmmvfrr",
  //   // cropping: true, //add a cropping step
  //   // showAdvancedOptions: true,  //dd advanced options (public_id and tag)
  //   // sources: [ "local", "url"], // restrict the upload sources to URL and local files
  //   multiple: false, //restrict upload to a single file
  //   // folder: "user_images", //upload files to the specified folder
  //   // tags: [], //add the given tags to the uploaded files
  //   context: { skylark_object_uid: uid }, //add the given context data to the uploaded files
  //   // clientAllowedFormats: ["images"], //restrict uploading to image files only
  //   // maxImageFileSize: 2000000,  //restrict file size to less than 2MB
  //   // maxImageWidth: 2000, //Scales the image down to a width of 2000 pixels before uploading
  //   // theme: "purple", //change to a purple theme
  // });

  const [loaded, setLoaded] = useState(false);

  const widgetRef = useRef<{ open: () => void } | null>(null);

  useEffect(() => {
    // Check if the script is already loaded
    if (!loaded) {
      const uwScript = document.getElementById("uw");
      if (!uwScript) {
        // If not loaded, create and load the script
        const script = document.createElement("script");
        script.setAttribute("async", "");
        script.setAttribute("id", "uw");
        script.src = "https://upload-widget.cloudinary.com/global/all.js";
        script.addEventListener("load", () => setLoaded(true));
        document.body.appendChild(script);
      } else {
        // If already loaded, update the state
        setLoaded(true);
      }
    }
  }, [loaded]);

  console.log({
    ...custom,
    context:
      custom?.context && isObject(custom.context)
        ? { ...custom.context, ...{ skylark_object_uid: uid } }
        : { skylark_object_uid: uid },
    cloudName,
  });

  const initializeCloudinaryWidget = () => {
    if (loaded) {
      const integrationContext = { skylark_object_uid: uid };

      const uwConfig = {
        ...custom,
        context:
          custom?.context && isObject(custom.context)
            ? { ...custom.context, ...integrationContext }
            : integrationContext,
        cloudName,
      };

      const myWidget =
        hasProperty<Window & typeof globalThis, string, CloudinaryWidget>(
          window,
          "cloudinary",
        ) &&
        window.cloudinary.createUploadWidget(uwConfig, (error) => {
          if (error) {
            toast.error(
              <Toast
                title="Cloudinary Upload Error"
                message={error.statusText || error.status}
              />,
              { autoClose: 20000 },
            );
          }
        });

      if (myWidget) widgetRef.current = myWidget;
    }
  };

  return (
    <CloudinaryScriptContext.Provider value={{ loaded }}>
      <Button
        variant="outline"
        onClick={() => {
          initializeCloudinaryWidget();
          widgetRef.current?.open();
        }}
      >
        Open Cloudinary Widget
      </Button>
    </CloudinaryScriptContext.Provider>
  );
};

export const CloudinaryUploader = ({ uid }: CloudinaryUploaderProps) => {
  const { data, isLoading } = useGenerateCloudinaryUploadUrl(uid);

  return (
    <>
      {data && (
        <CloudinaryUploadWidget
          uid={uid}
          cloudName={data.cloud_name}
          custom={data.custom}
        />
      )}
      {isLoading && <Skeleton className="h-52 w-full" />}
    </>
  );
};
