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
  fieldsToPopulate?: string[];
  context?: string;
  language?: string;
  setUid?: string;
}

type MutationArgs = Omit<AIGeneratedFieldsVariables, "rootFieldData"> & {
  rootFieldData: object;
  fieldToFill?: string;
};

const select = (data?: {
  AiAssistant: string;
}): Record<string, SkylarkObjectMetadataField[]> => {
  if (!data) {
    return {};
  }

  try {
    const json = JSON.parse(data.AiAssistant) as Record<
      string,
      SkylarkObjectMetadataField
    >[];

    const initialValue: Record<string, SkylarkObjectMetadataField[]> = {};

    const fieldSuggestions = json.reduce((prev, suggestionObj) => {
      Object.entries(suggestionObj).forEach(([key, value]) => {
        if (prev?.[key]) {
          if (!prev[key].includes(value)) {
            prev[key] = [...prev[key], value];
          }
        } else {
          prev = {
            ...prev,
            [key]: [value],
          };
        }
      });

      return prev;
    }, initialValue);

    return fieldSuggestions;
  } catch {
    return {};
  }
};

export const useAIGeneratedFields = ({
  onFieldsGenerated,
}: {
  onFieldsGenerated?: (
    data: Record<string, SkylarkObjectMetadataField[]>,
    variables: MutationArgs,
    context: unknown,
  ) => unknown;
}) => {
  const { data, mutate, isPending } = useMutation<
    Record<string, SkylarkObjectMetadataField[]>,
    { response?: { errors?: { errorType?: string; message?: string }[] } },
    MutationArgs
  >({
    mutationKey: ["aiFieldSuggestions"],
    mutationFn: async ({ rootFieldData, ...argVariables }) => {
      const variables: AIGeneratedFieldsVariables & Record<string, unknown> = {
        ...argVariables,
        rootFieldData: JSON.stringify(rootFieldData),
      };
      const data = await skylarkRequest<{ AiAssistant: string }>(
        "query",
        AI_FIELD_SUGGESTIONS,
        variables,
      );

      return select(data);
    },
    onSuccess: onFieldsGenerated,
  });

  console.log({ data });

  const getGeneratedFieldSuggestion = useCallback(
    (field: string, currentValue?: SkylarkObjectMetadataField) => {
      const suggestions = data?.[field];
      if (!suggestions) {
        return null;
      }

      if (currentValue) {
        const nextSuggestionIndex = suggestions.indexOf(currentValue) + 1;
        return suggestions?.[
          nextSuggestionIndex >= suggestions.length ? 0 : nextSuggestionIndex
        ];
      }
      return suggestions?.[0];
    },
    [data],
  );

  return {
    generatedFieldValues: data,
    generateFieldValues: mutate,
    getGeneratedFieldSuggestion,
    isGeneratingAiSuggestions: isPending,
  };
};
