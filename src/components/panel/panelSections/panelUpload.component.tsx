import { useState } from "react";
import { FiUploadCloud } from "react-icons/fi";

import { Select, SelectOption } from "src/components/inputs/select";
import {
  IntegrationUploadType,
  IntegrationUploaderProvider,
  IntegrationUploader,
} from "src/components/integrations";
import { PanelSectionTitle } from "src/components/panel/panelTypography";
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

  const { data } = useGetIntegrations(type);

  const sections = generateSections(type);
  const uploaderOpts = { uid, objectType };

  // SkylarkImage shows image on Metadata tab, SkylarkAsset uses Playback
  const onSuccess = () =>
    setTab(type === "image" ? PanelTab.Metadata : PanelTab.Playback);

  const [selected, setSelected] = useState<IntegrationUploaderProvider>(
    sections?.[0].id,
  );

  const options =
    data?.enabledIntegrations.map(
      (name): SelectOption<IntegrationUploaderProvider> => ({
        label: name,
        value: name,
      }),
    ) || [];

  return (
    <PanelSectionLayout sections={sections} isPage={isPage}>
      <PanelSectionTitle text={"Upload"} />
      {data?.enabledIntegrations && data?.enabledIntegrations.length >= 2 && (
        <Select
          options={options}
          selected={selected}
          onChange={setSelected}
          variant="primary"
          placeholder="Select Provider"
        />
      )}
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
