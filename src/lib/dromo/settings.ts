import dayjs from "dayjs";
import { IDeveloperStyleOverrides } from "dromo-uploader-react";

import { ObjectTypeWithConfig } from "src/hooks/useSkylarkObjectTypes";

import { DromoSchema } from "./schema";

const skylarkBlue = "#226DFF";
const skylarkBlueHover = "#0055FF";
const success = "#33BD6E";

const styleOverrides: IDeveloperStyleOverrides = {
  global: {
    textColor: undefined,
    primaryTextColor: "#0E1825",
    secondaryTextColor: undefined,
    successColor: success,
    warningColor: "#FBBD23",
    customFontURL:
      "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
    customFontFamily: "'Inter', sans-serif",
    backgroundColor: "#fff",
    borderRadius: undefined,
    borderWidth: undefined,
    borderColor: undefined,
    borderStyle: undefined,
  },
  primaryButton: {
    borderRadius: "9999px",
    backgroundColor: skylarkBlue,
    textColor: "#fff",
    border: undefined,
    hoverBackgroundColor: skylarkBlueHover,
    hoverTextColor: undefined,
    hoverBorder: undefined,
  },
  secondaryButton: {
    borderRadius: undefined,
    backgroundColor: "#fff",
    textColor: skylarkBlue,
    border: `1px solid ${skylarkBlue}`,
    hoverBackgroundColor: skylarkBlue,
    hoverTextColor: "#fff",
    hoverBorder: `1px solid ${skylarkBlue}`,
  },
  tertiaryButton: {
    borderRadius: undefined,
    backgroundColor: undefined,
    textColor: undefined,
    border: undefined,
    hoverBackgroundColor: undefined,
    hoverTextColor: undefined,
    hoverBorder: undefined,
  },
  dropzone: {
    borderWidth: undefined,
    borderRadius: undefined,
    borderColor: undefined,
    borderStyle: undefined,
    backgroundColor: undefined,
    color: undefined,
    outline: undefined,
  },
  helpText: {
    textColor: undefined,
    backgroundColor: undefined,
  },
  stepperBar: {
    completeColor: success,
    incompleteColor: undefined,
    currentColor: skylarkBlue,
    fontSize: undefined,
    completeFontWeight: undefined,
    incompleteFontWeight: undefined,
    currentFontWeight: undefined,
    backgroundColor: undefined,
    borderBottom: undefined,
  },
  dataTable: {
    headerFontWeight: undefined,
  },
};

export const getDromoSettings = (
  { objectType, config }: ObjectTypeWithConfig,
  accountIdentifier: string,
) => {
  const objectTypeDisplay = config.objectTypeDisplayName || objectType;
  const settings: DromoSchema["settings"] = {
    importIdentifier: `${accountIdentifier}-${objectType}-${dayjs().format("YYYY_MM_DD__HH_mm")}`,
    title: `Import ${objectTypeDisplay}`,
    allowCustomFields: false,
    styleOverrides,
    templateDownloadFilename: `${objectTypeDisplay}_skylark_import_template`,
  };

  return settings;
};
