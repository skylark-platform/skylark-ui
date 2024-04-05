import { toast } from "react-toastify";
import { sentenceCase } from "sentence-case";

import {
  MuxUploader,
  CloudinaryUploader,
  BitmovinUploader,
} from "src/components/integrations";
import {
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { Toast } from "src/components/toast/toast.component";
import { useGetIntegrations } from "src/hooks/integrations/useGetIntegrations";
import { PanelTab } from "src/hooks/state";
import { BuiltInSkylarkObjectType } from "src/interfaces/skylark";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelUploadProps {
  uid: string;
  objectType: string;
  language: string;
  isPage?: boolean;
  inEditMode: boolean;
  // objectMeta: SkylarkObjectMeta | null;
  setTab: (t: PanelTab) => void;
}

type UploadType = "image" | "video";

type UploaderProvider = "mux" | "cloudinary" | "bitmovin";

const generateSections = (
  type: UploadType,
): { id: UploaderProvider; htmlId: string; title: string }[] => {
  if (type === "image") {
    return [
      {
        id: "cloudinary",
        htmlId: "panel-cloudinary-uploader",
        title: "Cloudinary",
      },
    ];
  }

  return [
    {
      id: "mux",
      htmlId: "panel-mux-uploader",
      title: "Mux",
    },
    {
      id: "cloudinary",
      htmlId: "panel-cloudinary-uploader",
      title: "Cloudinary",
    },
    // {
    //   id: "bitmovin",
    //   htmlId: "panel-bitmovin-uploader",
    //   title: "Bitmovin",
    // },
  ];
};

const Uploader = ({
  provider,
  type,
  opts,
  onSuccess,
}: {
  provider: UploaderProvider;
  type: UploadType;
  opts: { uid: string };
  onSuccess: () => void;
}) => {
  const onSuccessWrapper = () => {
    toast.success(
      <Toast
        title={"Upload Successful"}
        message={`${sentenceCase(provider)} is processing your ${type}...`}
      />,
    );
    onSuccess();
  };

  if (provider === "mux") {
    return <MuxUploader uid={opts.uid} onSuccess={onSuccessWrapper} />;
  }

  if (provider === "cloudinary") {
    return <CloudinaryUploader uid={opts.uid} onSuccess={onSuccessWrapper} />;
  }

  if (provider === "bitmovin") {
    return <BitmovinUploader uid={opts.uid} onSuccess={onSuccessWrapper} />;
  }

  return <></>;
};

export const PanelUpload = ({
  uid,
  isPage,
  objectType,
  setTab,
}: PanelUploadProps) => {
  const type: UploadType =
    objectType === BuiltInSkylarkObjectType.SkylarkImage ? "image" : "video";

  useGetIntegrations();

  const sections = generateSections(type);
  const uploaderOpts = { uid };

  // SkylarkImage shows image on Metadata tab, SkylarkAsset uses Playback
  const onSuccess = () =>
    setTab(type === "image" ? PanelTab.Metadata : PanelTab.Playback);

  return (
    <PanelSectionLayout sections={sections} isPage={isPage}>
      <PanelSectionTitle text={"Upload"} />
      {sections.map(({ id, title, htmlId }) => (
        <div key={id} id={htmlId} className="relative mb-8">
          <PanelFieldTitle text={title} />
          <Uploader
            provider={id}
            type={type}
            opts={uploaderOpts}
            onSuccess={onSuccess}
          />
        </div>
      ))}
    </PanelSectionLayout>
  );
};
