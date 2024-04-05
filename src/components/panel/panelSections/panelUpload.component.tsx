import { MuxUploader } from "src/components/integrations";
import CloudinaryUploadWidget from "src/components/integrations/cloudinary/cloudinaryUploader.component";
import {
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { useGetIntegrations } from "src/hooks/integrations/useGetIntegrations";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelUploadProps {
  uid: string;
  objectType: string;
  language: string;
  isPage?: boolean;
  inEditMode: boolean;
  // objectMeta: SkylarkObjectMeta | null;
}

type UploaderType = "mux" | "cloudinary";

const Uploader = ({
  type,
  opts,
}: {
  type: UploaderType;
  opts: { uid: string };
}) => {
  if (type === "mux") {
    return <MuxUploader uid={opts.uid} />;
  }

  if (type === "cloudinary") {
    return <CloudinaryUploadWidget uid={opts.uid} />;
  }

  return <></>;
};

export const PanelUpload = ({ uid, isPage }: PanelUploadProps) => {
  useGetIntegrations();

  const uploaderOpts = { uid };

  const sections: { id: UploaderType; htmlId: string; title: string }[] = [
    // {
    //   id: "mux",
    //   htmlId: "panel-mux-uploader",
    //   title: "Mux",
    // },
    {
      id: "cloudinary",
      htmlId: "panel-cloudinary-uploader",
      title: "Cloudinary",
    },
  ];

  return (
    <PanelSectionLayout sections={sections} isPage={isPage}>
      <PanelSectionTitle text={"Upload"} />
      {sections.map(({ id, title, htmlId }) => (
        <div key={id} id={htmlId} className="relative mb-8">
          <PanelFieldTitle text={title} />
          <Uploader type={id} opts={uploaderOpts} />
        </div>
      ))}
    </PanelSectionLayout>
  );
};
