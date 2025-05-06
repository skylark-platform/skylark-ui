import { useMutation } from "@tanstack/react-query";

import {
  GQLSkylarkErrorResponse,
  GQLSkylarkSchemaVersion,
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { CREATE_SCHEMA_VERSION } from "src/lib/graphql/skylark/mutations";
import { parseSchemaVersion } from "src/lib/skylark/parsers";

interface MutationArgs {
  basedOnVersion: number;
}

export const createSchemaVersionRequest = async (basedOnVersion: number) => {
  const response = await skylarkRequest<{
    createSchemaVersion: GQLSkylarkSchemaVersion;
  }>("mutation", CREATE_SCHEMA_VERSION, {
    basedOnVersion,
  });

  return parseSchemaVersion(response.createSchemaVersion);
};

export const useCreateSchemaVersion = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (version: SchemaVersion) => void;
  onError?: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const { mutate, isPending } = useMutation({
    mutationFn: (basedOnVersion: MutationArgs["basedOnVersion"]) =>
      createSchemaVersionRequest(basedOnVersion),
    onSuccess: (newSchemaVersion) => onSuccess?.(newSchemaVersion),
    onError,
  });

  return {
    createSchemaVersion: mutate,
    isCreatingSchemaVersion: isPending,
  };
};
