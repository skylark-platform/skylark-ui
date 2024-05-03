import clsx from "clsx";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "src/components/button";
import { Input, TextInput } from "src/components/inputs/input";
import { MultiSelect } from "src/components/inputs/multiselect/multiselect.component";
import { Modal } from "src/components/modals/base/modal";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { Toast } from "src/components/toast/toast.component";
import { useCreateOrUpdateApiKey } from "src/hooks/apiKeys/useCreateOrUpdateApiKey";
import { useDeleteApiKey } from "src/hooks/apiKeys/useDeleteApiKey";
import { useBulkDeleteObjects } from "src/hooks/objects/delete/useBulkDeleteObjects";
import {
  useSkylarkSchemaEnum,
  useSkylarkSchemaInterfaceType,
} from "src/hooks/useSkylarkSchemaIntrospection";
import {
  ParsedSkylarkObject,
  SkylarkGraphQLAPIKey,
} from "src/interfaces/skylark";
import { parseDateTimeForHTMLForm } from "src/lib/skylark/parsers";
import { hasProperty } from "src/lib/utils";

const DELETION_LIMIT = 100;
const VERIFICATION_TEXT = "permanently delete";

interface ApiKeyModalProps {
  isOpen: boolean;
  existingApiKey?: SkylarkGraphQLAPIKey;
  closeModal: () => void;
}

interface ApiKeyModalContentProps extends ApiKeyModalProps {
  apiPermissionEnumValues: string[];
}

type FormInputs = Omit<SkylarkGraphQLAPIKey, "api_key">;

const generateDescription = (
  objectsToBeDeleted: ParsedSkylarkObject[],
  multipleLanguages: boolean,
) => {
  if (objectsToBeDeleted.length > 1) {
    const objectTypeDesc = multipleLanguages
      ? "objects and translations"
      : "objects";
    return `The following ${objectTypeDesc} will be permanently deleted:`;
  }

  if (objectsToBeDeleted.length === 1) {
    const objectTypeDesc =
      objectsToBeDeleted[0].meta.availableLanguages.length > 1
        ? "translation"
        : "object";
    return `The following ${objectTypeDesc} will be permanently deleted:`;
  }

  return "No objects selected for deletion.";
};

const DeleteButtonWithConfirmation = ({
  confirmationMessage,
  isDeleting,
  onConfirmed,
  onCancel,
}: {
  confirmationMessage: string;
  onConfirmed: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) => {
  const [showDeleteVerification, setShowDeleteVerficiation] = useState(false);
  const [input, setInput] = useState("");

  return (
    <div className="mt-6">
      {showDeleteVerification && (
        <div>
          <p className="mb-2">
            {`To confirm deletion, enter "${VERIFICATION_TEXT}" in the text input
            field.`}
          </p>
          <TextInput
            value={input}
            onChange={setInput}
            placeholder={VERIFICATION_TEXT}
          />
        </div>
      )}
      <div className="mt-4 flex justify-end space-x-2">
        {showDeleteVerification ? (
          <>
            <Button
              variant="primary"
              type="button"
              danger
              loading={isDeleting}
              disabled={input !== VERIFICATION_TEXT}
              onClick={() => {
                onConfirmed();
              }}
            >
              {confirmationMessage}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowDeleteVerficiation(false)}
            >
              Go back
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              type="button"
              danger
              loading={false}
              onClick={() => {
                setInput("");
                setShowDeleteVerficiation(true);
              }}
            >
              {`Delete objects`}
            </Button>
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const ApiKeyModalContent = ({
  existingApiKey,
  apiPermissionEnumValues,
  closeModal,
}: ApiKeyModalContentProps) => {
  const isEdit = !!existingApiKey;

  const {
    handleSubmit,
    register,
    watch,
    control,
    formState: { errors },
  } = useForm<FormInputs>({
    defaultValues: existingApiKey,
  });

  const { createApiKey, updateApiKey, isPending } = useCreateOrUpdateApiKey({
    onSuccess: ({ name }) => {
      toast.success(
        <Toast
          title={`Key "${name}" ${isEdit ? "updated" : "added"}`}
          message={[
            isEdit
              ? "An API Key has been updated."
              : `A new API Key has been added to your account.`,
          ]}
        />,
      );
      closeModal();
    },
    onError: console.log,
  });

  const options = useMemo(
    () => apiPermissionEnumValues?.map((value) => ({ label: value, value })),
    [apiPermissionEnumValues],
  );

  const onSubmit: SubmitHandler<FormInputs> = (data) =>
    isEdit
      ? updateApiKey({ ...data, name: existingApiKey.name })
      : createApiKey(data);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="my-8 min-h-64 flex flex-col h-full gap-6"
    >
      {/* register your input into the hook by invoking the "register" function */}
      <Controller
        name={"name"}
        control={control}
        disabled={isEdit}
        render={({ field }) => (
          <TextInput
            label="Name"
            disabled={field.disabled}
            value={field.value || ""}
            onChange={field.onChange}
          />
        )}
      />
      {errors.name && <span>This field is required</span>}

      <Controller
        name={"permissions"}
        control={control}
        render={({ field }) => {
          const selected = field.value || [];

          return (
            <MultiSelect
              label="Permissions"
              labelVariant="form"
              options={options || []}
              selected={selected}
              onChange={(values) => {
                console.log({ values });
                field.onChange(values);
              }}
            />
          );
        }}
      />

      <Controller
        name={"expires"}
        control={control}
        render={({ field }) => (
          <Input
            label="Expiry Date"
            type="datetime-local"
            value={parseDateTimeForHTMLForm("datetime-local", field.value)}
            onChange={field.onChange}
          />
        )}
      />

      <div className="flex justify-end flex-grow items-end mt-8">
        <Button variant="primary" type="submit" loading={isPending}>
          {isEdit ? "Update" : "Create"}
        </Button>
        <Button
          variant="outline"
          danger
          className="ml-2"
          onClick={closeModal}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export const ApiKeyModal = (props: ApiKeyModalProps) => {
  const { isOpen, existingApiKey, closeModal } = props;

  const isEdit = !!existingApiKey;

  const { data: apiPermissionEnum } = useSkylarkSchemaEnum(
    "SkylarkAPIPermission",
  );

  return (
    <Modal
      title={isEdit ? "Edit API Key" : "Create API Key"}
      description={""}
      isOpen={isOpen}
      closeModal={closeModal}
      data-testid="create-api-key-modal"
      size="medium"
    >
      <ApiKeyModalContent
        {...props}
        key="content"
        apiPermissionEnumValues={apiPermissionEnum?.values || []}
      />
    </Modal>
  );
};
