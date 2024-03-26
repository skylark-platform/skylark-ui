import { useCallback } from "react";
import { UseFormProps, UseFormReturn, useForm } from "react-hook-form";

import { useAIFieldSuggestions } from "src/hooks/ai/useAIFieldSuggestions";
import { SkylarkObjectMetadataField } from "src/interfaces/skylark";

export interface AIFieldGeneration {
  isGeneratingAiSuggestions: boolean;
  hasAiSuggestions: boolean;
  formHasValues: boolean;
  populateFieldUsingAiValue: (field: string) => void;
  populateAllFieldsUsingAiValues: () => void;
  generateFieldSuggestions: () => void;
  fieldIsAiSuggestion: (field: string) => boolean;
}

export interface UseSkylarkObjectFormWithAutogeneratedValuesReturn
  extends UseFormReturn<Record<string, SkylarkObjectMetadataField>> {
  aiFieldGeneration: AIFieldGeneration;
  formHasObjectValues: boolean;
}

const formHasObjectPropertyValues = (values: object) => {
  const fieldWithValues = Object.entries(values).filter(
    ([key, value]) => !key.startsWith("_") && (value || value === false),
  );

  return fieldWithValues.length > 0;
};

const getSuggestionForField = (
  suggestions: Record<string, SkylarkObjectMetadataField[]>,
  field: string,
) => {
  const values = suggestions?.[field];
  return values?.[0];
};

export const useSkylarkObjectFormWithAutogeneratedValues = ({
  objectType,
  uid,
  isSet,
  language,
  onSuggestionsGenerated,
  onSuggestionGenerationError,
  formProps,
}: {
  objectType: string;
  uid?: string;
  isSet: boolean;
  language?: string;
  formProps?: UseFormProps;
  onSuggestionsGenerated: () => void;
  onSuggestionGenerationError: () => void;
}): UseSkylarkObjectFormWithAutogeneratedValuesReturn => {
  const { setValue, getValues, ...form } =
    useForm<Record<string, SkylarkObjectMetadataField>>(formProps);

  const onFieldsGeneratedWrapper = useCallback(
    (
      data: Record<string, SkylarkObjectMetadataField[]>,
      { fieldsToAutoFill }: { fieldsToAutoFill?: string[] },
    ) => {
      if (fieldsToAutoFill) {
        fieldsToAutoFill.forEach((fieldToFill) => {
          const value = getSuggestionForField(data, fieldToFill);
          if (value) {
            setValue(fieldToFill, value, {
              shouldTouch: true,
              shouldDirty: true,
            });
          }
        });
      }
      onSuggestionsGenerated();
    },
    [onSuggestionsGenerated, setValue],
  );

  const {
    generateFieldValues,
    generatedFieldValues,
    getGeneratedFieldSuggestion,
    isGeneratingAiSuggestions,
  } = useAIFieldSuggestions({
    onSuggestionsGenerated: onFieldsGeneratedWrapper,
    onSuggestionGenerationError,
  });

  const hasAiSuggestions = Boolean(generatedFieldValues);

  const generateFieldValuesWrapper = useCallback(
    (fieldsToAutoFill?: string[]) => {
      const setUid = (isSet && uid) || undefined;
      generateFieldValues({
        objectType,
        language: language || (getValues("_language") as string | undefined),
        rootFieldData: getValues(),
        fieldsToAutoFill,
        setUid,
      });
    },
    [isSet, uid, generateFieldValues, objectType, language, getValues],
  );

  const populateFieldUsingAiValue = useCallback(
    (field: string) => {
      if (!hasAiSuggestions) {
        generateFieldValuesWrapper([field]);
        return;
      }

      const value = getGeneratedFieldSuggestion(field, getValues(field));
      if (value !== undefined) {
        setValue(field, value, { shouldTouch: true, shouldDirty: true });
      }
    },
    [
      hasAiSuggestions,
      getGeneratedFieldSuggestion,
      getValues,
      generateFieldValuesWrapper,
      setValue,
    ],
  );

  const populateAllFieldsUsingAiValues = useCallback(() => {
    const fields = Object.keys(getValues()).filter(
      (field) => !field.startsWith("_"),
    );

    if (!hasAiSuggestions) {
      generateFieldValuesWrapper(fields);
      return;
    }

    fields.forEach((field) => {
      const value = getGeneratedFieldSuggestion(field, getValues(field));
      if (value !== undefined) {
        setValue(field, value, { shouldTouch: true, shouldDirty: true });
      }
    });
  }, [
    generateFieldValuesWrapper,
    getGeneratedFieldSuggestion,
    getValues,
    hasAiSuggestions,
    setValue,
  ]);

  const formHasObjectValues = formHasObjectPropertyValues(getValues());

  console.log({ formHasObjectValues, values: getValues() });

  const fieldIsAiSuggestion = useCallback(
    (field: string) => {
      const value = getValues(field);
      const suggestions = generatedFieldValues?.[field];
      return Boolean(suggestions?.includes(value));
    },
    [generatedFieldValues, getValues],
  );

  const aiFieldGeneration: AIFieldGeneration = {
    populateFieldUsingAiValue,
    populateAllFieldsUsingAiValues,
    isGeneratingAiSuggestions,
    generateFieldSuggestions: generateFieldValuesWrapper,
    hasAiSuggestions: Boolean(generatedFieldValues),
    formHasValues: formHasObjectValues,
    fieldIsAiSuggestion,
  };

  return {
    ...form,
    setValue,
    getValues,
    formHasObjectValues,
    aiFieldGeneration,
  };
};
