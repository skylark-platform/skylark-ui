import { MuxUploader, CloudinaryUploader } from "src/components/integrations";
import {
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { useGetIntegrations } from "src/hooks/integrations/useGetIntegrations";
import { BuiltInSkylarkObjectType } from "src/interfaces/skylark";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelUploadProps {
  uid: string;
  objectType: string;
  language: string;
  isPage?: boolean;
  inEditMode: boolean;
  // objectMeta: SkylarkObjectMeta | null;
}

type UploadType = "image" | "video";

type UploaderProvider = "mux" | "cloudinary";

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
  ];
};

const Uploader = ({
  provider,
  opts,
}: {
  provider: UploaderProvider;
  opts: { uid: string };
}) => {
  if (provider === "mux") {
    return <MuxUploader uid={opts.uid} />;
  }

  if (provider === "cloudinary") {
    return <CloudinaryUploader uid={opts.uid} />;
  }

  return <></>;
};

export const PanelUpload = ({ uid, isPage, objectType }: PanelUploadProps) => {
  const type: UploadType =
    objectType === BuiltInSkylarkObjectType.SkylarkImage ? "image" : "video";

  useGetIntegrations();

  const sections = generateSections(type);
  const uploaderOpts = { uid };

  return (
    <PanelSectionLayout sections={sections} isPage={isPage}>
      <PanelSectionTitle text={"Upload"} />
      {sections.map(({ id, title, htmlId }) => (
        <div key={id} id={htmlId} className="relative mb-8">
          <PanelFieldTitle text={title} />
          <Uploader provider={id} opts={uploaderOpts} />
        </div>
      ))}
    </PanelSectionLayout>
  );
};
