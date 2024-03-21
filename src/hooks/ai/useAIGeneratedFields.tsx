import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import {
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { AI_FIELD_SUGGESTIONS } from "src/lib/graphql/skylark/queries";

interface AIGeneratedFieldsVariables {
  objectType: SkylarkObjectType;
  rootFieldData: string;
  fieldsToPopulate: string[];
  context?: string;
  language?: string;
}

type MutationArgs = Omit<AIGeneratedFieldsVariables, "rootFieldData"> & {
  rootFieldData: object;
  fieldToFill?: string;
};

const select = (data?: { AiAssistant: string }) => {
  if (!data) {
    return undefined;
  }

  try {
    const json = JSON.parse(data.AiAssistant) as Record<
      string,
      SkylarkObjectMetadataField
    >[];
    return json;
  } catch {
    return [];
  }
};

export const useAIGeneratedFields = ({
  onFieldsGenerated,
}: {
  onFieldsGenerated?: (
    data: {
      AiAssistant: string;
    },
    variables: MutationArgs,
    context: unknown,
  ) => unknown;
}) => {
  const {
    data: response,
    mutate,
    isPending,
  } = useMutation<
    { AiAssistant: string },
    { response?: { errors?: { errorType?: string; message?: string }[] } },
    MutationArgs
  >({
    mutationKey: ["aiFieldSuggestions"],
    mutationFn: ({ rootFieldData, ...argVariables }) => {
      const variables: AIGeneratedFieldsVariables & Record<string, unknown> = {
        ...argVariables,
        rootFieldData: JSON.stringify(rootFieldData),
      };
      return skylarkRequest<{ AiAssistant: string }>(
        "query",
        AI_FIELD_SUGGESTIONS,
        variables,
      );
    },
    onSuccess: onFieldsGenerated,
  });

  const data = useMemo(() => select(response), [response]);

  console.log({ data });

  const getGeneratedFieldValues = useCallback(
    (field: string) => {
      return data
        ?.map((values) => values?.[field])
        .filter((value) => value !== undefined);
    },
    [data],
  );

  return {
    generatedFieldValues: data,
    generateFieldValues: mutate,
    getGeneratedFieldValues,
    isGeneratingAiSuggestions: isPending,
  };
};
