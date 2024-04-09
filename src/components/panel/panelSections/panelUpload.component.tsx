import { useState } from "react";
import { FiUploadCloud } from "react-icons/fi";

import { Select, SelectOption } from "src/components/inputs/select";
import {
  IntegrationUploadType,
  IntegrationUploader,
  IntegrationUploaderProvider,
} from "src/components/integrations/uploader/uploader.component";
import {
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
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

const generateSections = (
  type: IntegrationUploadType,
): { id: IntegrationUploaderProvider; htmlId: string; title: string }[] => {
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
    {
      id: "bitmovin",
      htmlId: "panel-bitmovin-uploader",
      title: "Bitmovin",
    },
  ];
};

export const PanelUpload = ({
  uid,
  isPage,
  objectType,
  setTab,
}: PanelUploadProps) => {
  const type: IntegrationUploadType =
    objectType === BuiltInSkylarkObjectType.SkylarkImage ? "image" : "video";

  useGetIntegrations();

  const sections = generateSections(type);
  const uploaderOpts = { uid };

  // SkylarkImage shows image on Metadata tab, SkylarkAsset uses Playback
  const onSuccess = () =>
    setTab(type === "image" ? PanelTab.Metadata : PanelTab.Playback);

  const [selected, setSelected] = useState<IntegrationUploaderProvider>(
    sections?.[0].id,
  );

  const options = sections.map(
    ({ title, id }): SelectOption<IntegrationUploaderProvider> => ({
      label: title,
      value: id,
    }),
  );

  return (
    <PanelSectionLayout sections={sections} isPage={isPage}>
      <PanelSectionTitle text={"Upload"} />
      {/* {sections.map(({ id, title, htmlId }) => (
        <div key={id} id={htmlId} className="relative mb-8 space-y-1">
          <PanelFieldTitle text={title} />
          <IntegrationUploader
            provider={id}
            type={type}
            opts={uploaderOpts}
            buttonProps={{ variant: "outline" }}
            onSuccess={onSuccess}
          />
        </div>
      ))} */}
      <Select
        options={options}
        selected={selected}
        onChange={setSelected}
        variant="primary"
        placeholder="Select Provider"
      />
      {selected && (
        <div className="mt-4">
          <IntegrationUploader
            provider={selected}
            type={type}
            opts={uploaderOpts}
            buttonProps={{
              variant: "outline",
              children: "Upload",
              Icon: <FiUploadCloud className="text-lg" />,
            }}
            onSuccess={onSuccess}
          />
        </div>
      )}
    </PanelSectionLayout>
  );
};
