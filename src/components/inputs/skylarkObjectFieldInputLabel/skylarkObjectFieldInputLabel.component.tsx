import clsx from "clsx";
import { CgSpinner } from "react-icons/cg";
import { GrMagic } from "react-icons/gr";

import { Button } from "src/components/button";
import {
  InputLabel,
  InputLabelProps,
} from "src/components/inputs/label/label.component";
import { Tooltip } from "src/components/tooltip/tooltip.component";
import { SEGMENT_KEYS } from "src/constants/segment";
import { AIFieldGeneration } from "src/hooks/forms/useSkylarkObjectFormWithAutogeneratedValues";
import { segment } from "src/lib/analytics/segment";

export type SkylarkObjectFieldInputLabelProps = {
  field: string;
  idPrefix: string;
  hasValue: boolean;
  aiFieldGeneration?: AIFieldGeneration;
} & Omit<InputLabelProps, "text">;

export const createHtmlForId = (prefix: string, field: string) =>
  `${prefix}-skylark-object-field-input-${field}`;

const AiTooltip = ({
  fieldHasValue,
  formHasValues,
  isGeneratingAiSuggestions,
  triggerAiFieldGeneration,
}: {
  fieldHasValue: boolean;
  formHasValues: boolean;
  isGeneratingAiSuggestions: boolean;
  triggerAiFieldGeneration: () => void;
}) => {
  const RefreshResultsButton = () => (
    <div>
      <Button
        variant="form"
        className="mt-4 w-auto"
        onClick={triggerAiFieldGeneration}
      >
        Refresh suggestions
      </Button>
    </div>
  );

  if (isGeneratingAiSuggestions) {
    return (
      <>
        <CgSpinner className="mr-1 animate-spin-fast text-base md:text-lg" />
        <p className="font-normal">Generating AI suggestions</p>
      </>
    );
  }

  if (fieldHasValue) {
    return (
      <div className="flex flex-col max-w-80 items-center">
        <p className="font-normal">
          This field will be used when generating AI suggestions.
        </p>
        <RefreshResultsButton />
      </div>
    );
  }

  if (formHasValues) {
    return (
      <div className="flex flex-col max-w-80 items-center">
        <p className="font-normal">
          Click on the wand to populate the field using AI generated values.
        </p>
        <p className="font-normal mt-2">
          Alternatively, modify or add fields and refresh AI results.
        </p>
        <RefreshResultsButton />
      </div>
    );
  }

  return (
    <>
      <p className="font-normal">Populate fields to enable AI suggestions.</p>
    </>
  );
};

export const SkylarkObjectFieldInputLabel = ({
  field,
  idPrefix,
  aiFieldGeneration,
  hasValue,
  ...props
}: SkylarkObjectFieldInputLabelProps) => (
  <>
    <InputLabel
      text={field}
      htmlFor={createHtmlForId(idPrefix, field)}
      formatText
      {...props}
    >
      {aiFieldGeneration && (
        <div className="flex ml-2">
          <Tooltip
            tooltip={
              <AiTooltip
                fieldHasValue={hasValue}
                formHasValues={aiFieldGeneration.formHasValues}
                isGeneratingAiSuggestions={
                  aiFieldGeneration.isGeneratingAiSuggestions
                }
                triggerAiFieldGeneration={() => {
                  aiFieldGeneration.generateFieldSuggestions(field);
                }}
              />
            }
          >
            <span>
              <Button
                Icon={
                  <GrMagic
                    className={clsx(
                      "text-base",
                      aiFieldGeneration.isGeneratingAiSuggestions &&
                        "animate-pulse",
                    )}
                  />
                }
                data-testid="ai-field-fill"
                disabled={
                  !aiFieldGeneration.formHasValues ||
                  aiFieldGeneration.isGeneratingAiSuggestions ||
                  (hasValue && !aiFieldGeneration.fieldIsAiSuggestion(field))
                }
                variant="form"
                onClick={() => {
                  aiFieldGeneration.populateFieldUsingAiValue(field);
                  segment.track(
                    SEGMENT_KEYS.ai.fieldSuggestions.populateFormField,
                    { field, idPrefix },
                  );
                }}
              />
            </span>
          </Tooltip>
        </div>
      )}
    </InputLabel>
  </>
);
