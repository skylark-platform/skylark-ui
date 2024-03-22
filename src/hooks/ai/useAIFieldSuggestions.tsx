import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";

import {
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { AI_FIELD_SUGGESTIONS } from "src/lib/graphql/skylark/queries";

interface AIFieldSuggestionsVariables {
  objectType: SkylarkObjectType;
  rootFieldData: string;
  fieldsToPopulate?: string[];
  context?: string;
  language?: string;
  setUid?: string;
}

type MutationArgs = Omit<AIFieldSuggestionsVariables, "rootFieldData"> & {
  rootFieldData: object;
  fieldsToAutoFill?: string[];
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

export const useAIFieldSuggestions = ({
  onSuggestionsGenerated,
  onSuggestionGenerationError,
}: {
  onSuggestionsGenerated?: (
    data: Record<string, SkylarkObjectMetadataField[]>,
    variables: MutationArgs,
    context: unknown,
  ) => unknown;
  onSuggestionGenerationError?: () => void;
}) => {
  const { data, mutate, isPending } = useMutation<
    Record<string, SkylarkObjectMetadataField[]>,
    { response?: { errors?: { errorType?: string; message?: string }[] } },
    MutationArgs
  >({
    mutationKey: ["aiFieldSuggestions"],
    mutationFn: async ({
      rootFieldData,
      fieldsToPopulate,
      context,
      language,
      setUid,
      objectType,
    }) => {
      const sanitizedRootFieldData = JSON.stringify(
        Object.fromEntries(
          Object.entries(rootFieldData).filter(([, value]) => Boolean(value)),
        ),
      );

      const variables: AIFieldSuggestionsVariables & Record<string, unknown> = {
        fieldsToPopulate,
        context,
        language,
        setUid,
        objectType,
        rootFieldData: sanitizedRootFieldData,
      };
      const data = await skylarkRequest<{ AiAssistant: string }>(
        "query",
        AI_FIELD_SUGGESTIONS,
        variables,
        {},
        // {
        //   "x-gpt-model": "gpt-4",
        // },
      );
      return select(data);
    },
    onSuccess: onSuggestionsGenerated,
    onError: onSuggestionGenerationError,
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
