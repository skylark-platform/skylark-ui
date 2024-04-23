import { sentenceCase } from "change-case";

import { SkylarkSystemField } from "src/interfaces/skylark";

export const formatObjectField = (field?: string) => {
  if (!field) {
    return "";
  }

  if (field === SkylarkSystemField.UID) {
    return "UID";
  }

  return sentenceCase(field?.replaceAll("_", " "));
};

export const formatUriAsCustomerIdentifer = (uri: string | null) => {
  if (!uri) {
    return "";
  }

  const isIo = uri.includes("skylarkplatform.io");
  const isCom = uri.includes("skylarkplatform.com");
  const isValid = isIo || isCom;

  if (!isValid) {
    return "";
  }

  const isIntEnvironment = uri.includes(".api.int.development.");
  if (isIntEnvironment) {
    const identifier = uri.split("/")[2].split(".api.int.development.")[0];
    return `${sentenceCase(identifier)} (int)`;
  }

  const isProductionEnvironment = uri.includes(
    ".api.skylarkplatform.com/graphql",
  );
  if (isProductionEnvironment) {
    const identifier = uri.split("/")[2].split(".api.skylarkplatform.com")[0];
    return sentenceCase(identifier);
  }

  const path = uri.split(
    isCom ? "skylarkplatform.com" : "skylarkplatform.io",
  )[1];
  const splitPath = path.split("/").filter((p) => p);
  if (splitPath[0] !== "graphql") {
    return sentenceCase(splitPath[0]);
  }

  return sentenceCase(uri.split(".")[1]);
};
