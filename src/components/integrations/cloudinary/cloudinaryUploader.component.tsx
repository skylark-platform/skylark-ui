import { createContext, useEffect, useRef, useState } from "react";

import { Button } from "src/components/button";
import { hasProperty } from "src/lib/utils";

interface CloudinaryContext {
  loaded: boolean;
}

interface CloudinaryUploadWidgetProps {
  uid: string;
}

// Create a context to manage the script loading state
const CloudinaryScriptContext = createContext<CloudinaryContext>({
  loaded: false,
});

function CloudinaryUploadWidget({}: CloudinaryUploadWidgetProps) {
  const [uwConfig] = useState({
    cloudName: "dc5jkcqya",
    uploadPreset: "mfmmvfrr",
    // cropping: true, //add a cropping step
    // showAdvancedOptions: true,  //dd advanced options (public_id and tag)
    // sources: [ "local", "url"], // restrict the upload sources to URL and local files
    multiple: false, //restrict upload to a single file
    // folder: "user_images", //upload files to the specified folder
    // tags: ["users", "profile"], //add the given tags to the uploaded files
    // context: {alt: "user_uploaded"}, //add the given context data to the uploaded files
    // clientAllowedFormats: ["images"], //restrict uploading to image files only
    // maxImageFileSize: 2000000,  //restrict file size to less than 2MB
    // maxImageWidth: 2000, //Scales the image down to a width of 2000 pixels before uploading
    // theme: "purple", //change to a purple theme
  });

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

  const initializeCloudinaryWidget = () => {
    if (loaded) {
      const myWidget =
        hasProperty<
          Window & typeof globalThis,
          string,
          {
            createUploadWidget: (
              uwConfig: {
                cloudName: string;
              },
              cb: (
                error: Error,
                result: {
                  event: "success" | string;
                  info: { public_id: string };
                },
              ) => void,
            ) => { open: () => void };
          }
        >(window, "cloudinary") &&
        window.cloudinary.createUploadWidget(uwConfig, (error, result) => {
          if (!error && result && result.event === "success") {
            console.log("Done! Here is the image info: ", result.info);
            // setPublicId(result.info.public_id);
          }
        });

      if (myWidget) widgetRef.current = myWidget;

      // document.getElementById("upload_widget")?.addEventListener(
      //   "click",
      //   function () {
      //     myWidget.open();
      //   },
      //   false,
      // );
    }
  };

  return (
    <CloudinaryScriptContext.Provider value={{ loaded }}>
      {/* <button
        id="upload_widget"
        className="cloudinary-button"
        onClick={initializeCloudinaryWidget}
      >
        Upload
      </button> */}
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
}

export default CloudinaryUploadWidget;
export { CloudinaryScriptContext };
