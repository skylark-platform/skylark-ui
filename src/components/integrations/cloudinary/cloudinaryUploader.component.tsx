import { useQueryClient } from "@tanstack/react-query";
import { createContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import {
  BaseIntegrationUploaderProps,
  createIntegrationServiceObj,
} from "src/components/integrations/common";
import { Toast } from "src/components/toast/toast.component";
import {
  createIntegrationUploadQueryKeyBase,
  useGenerateIntegrationUploadUrl,
} from "src/hooks/integrations/useGenerateIntegrationUploadUrl";
import { IntegrationCloudinaryUploadUrlResponseBody } from "src/interfaces/skylark/integrations";
import { hasProperty, isObject } from "src/lib/utils";

interface CloudinaryContext {
  loaded: boolean;
}

type CloudinaryUploaderProps = BaseIntegrationUploaderProps;

interface CloudinaryUploadWidgetProps extends CloudinaryUploaderProps {
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
  objectType,
  relationshipName,
  cloudName,
  custom,
  buttonProps,
  onSuccess,
}: CloudinaryUploadWidgetProps) => {
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
      const integrationContext = createIntegrationServiceObj({
        uid,
        objectType,
        relationshipName,
      });

      const uwConfig = {
        ...custom,
        context:
          custom?.context && isObject(custom.context)
            ? { ...custom.context, ...integrationContext }
            : integrationContext,
        cloudName,
        multiple: false,
        styles: {
          palette: {
            window: "#FFF",
            windowBorder: "#90A0B3",
            tabIcon: "#226DFF",
            // menuIcons: "#5A616A",
            textDark: "#0E1825",
            textLight: "#FFFFFF",
            link: "#226DFF",
            // action: "",
            inactiveTabIcon: "#B8BCC6",
            error: "#F43636",
            inProgress: "#FBBD23",
            complete: "#33BD6E",
            // sourceBg: "#F0F2F6",
          },
          frame: {
            background: "#0E182599",
          },
          fonts: {
            "'Inter', sans-serif":
              "https://fonts.googleapis.com/css?family=Inter",
          },
        },
      };

      const myWidget =
        hasProperty<Window & typeof globalThis, string, CloudinaryWidget>(
          window,
          "cloudinary",
        ) &&
        window.cloudinary.createUploadWidget(uwConfig, (error, result) => {
          if (error) {
            toast.error(
              <Toast
                title="Cloudinary Upload Error"
                message={error.statusText || error.status}
              />,
              { autoClose: 20000 },
            );
          }

          if (!error && result.event === "success") {
            onSuccess();
          }
        });

      if (myWidget) widgetRef.current = myWidget;
    }
  };

  return (
    <CloudinaryScriptContext.Provider value={{ loaded }}>
      <Button
        {...buttonProps}
        onClick={() => {
          initializeCloudinaryWidget();
          widgetRef.current?.open();
        }}
      />
    </CloudinaryScriptContext.Provider>
  );
};

export const CloudinaryUploader = ({
  uid,
  objectType,
  relationshipName,
  buttonProps,
  playbackPolicy,
  onSuccess,
}: CloudinaryUploaderProps) => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } =
    useGenerateIntegrationUploadUrl<IntegrationCloudinaryUploadUrlResponseBody>(
      "image",
      "cloudinary",
      {
        uid,
        objectType,
        relationshipName,
      },
    );

  const onSuccessWrapper = () => {
    onSuccess();
    void queryClient.invalidateQueries({
      queryKey: createIntegrationUploadQueryKeyBase("image", "cloudinary"),
    });
  };

  return (
    <>
      {data && (
        <CloudinaryUploadWidget
          uid={uid}
          objectType={objectType}
          relationshipName={relationshipName}
          cloudName={data.cloud_name}
          custom={data.custom}
          playbackPolicy={playbackPolicy}
          buttonProps={{
            ...buttonProps,
            loading: isLoading,
            disabled: buttonProps.disabled || isError,
          }}
          onSuccess={onSuccessWrapper}
        />
      )}
    </>
  );
};
