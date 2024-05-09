import clsx from "clsx";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { InputLabel } from "src/components/inputs";
import { Input, TextInput } from "src/components/inputs/input";
import { MultiSelect } from "src/components/inputs/multiselect/multiselect.component";
import { Switch } from "src/components/inputs/switch/switch.component";
import { Modal } from "src/components/modals/base/modal";
import { Pill } from "src/components/pill";
import { Toast } from "src/components/toast/toast.component";
import { useCreateOrUpdateApiKey } from "src/hooks/apiKeys/useCreateOrUpdateApiKey";
import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";
import { useSkylarkSchemaEnum } from "src/hooks/useSkylarkSchemaIntrospection";
import { SkylarkGraphQLAPIKey } from "src/interfaces/skylark";
import { formatReadableDate } from "src/lib/skylark/availability";
import { parseDateTimeForHTMLForm } from "src/lib/skylark/parsers";

interface ApiKeyModalProps {
  isOpen: boolean;
  existingApiKey?: SkylarkGraphQLAPIKey;
  closeModal: () => void;
}

interface ApiKeyModalContentProps extends ApiKeyModalProps {
  apiPermissionEnumValues: string[];
}

type FormInputs = Omit<SkylarkGraphQLAPIKey, "api_key">;

const FormError = ({ text }: { text: string }) => (
  <span className="text-error -mt-5 -mb-2">{text}</span>
);

const ApiKeyModalContent = ({
  existingApiKey,
  apiPermissionEnumValues,
  closeModal,
}: ApiKeyModalContentProps) => {
  const isEdit = !!existingApiKey;

  const [creds] = useSkylarkCreds();

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormInputs>({
    defaultValues: existingApiKey,
  });

  const [apiKey, setApiKey] = useState("");

  const { createApiKey, updateApiKey, isPending } = useCreateOrUpdateApiKey({
    onSuccess: ({ name, api_key }) => {
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

      if (api_key) {
        setApiKey(api_key);
      } else {
        closeModal();
      }
    },
    onError: (err) => {
      toast.error(
        <Toast
          title={`Error ${isEdit ? "Updating" : "Creating"} key`}
          message={[
            "Please try again later.",
            err.response.errors?.[0].message,
          ]}
        />,
      );
    },
  });

  const options = useMemo(
    () => apiPermissionEnumValues?.map((value) => ({ label: value, value })),
    [apiPermissionEnumValues],
  );

  const onSubmit: SubmitHandler<FormInputs> = (data) =>
    isEdit
      ? updateApiKey({ ...data, name: existingApiKey.name })
      : createApiKey(data);

  const in1Day = dayjs().add(1, "day");
  const in1Week = dayjs().add(1, "week");
  const in1Month = dayjs().add(1, "month");
  const in3Months = dayjs().add(3, "month");
  const in6Months = dayjs().add(6, "month");
  const in1Year = dayjs().add(1, "year");

  const relativeDateArr = [
    { key: "1day", date: in1Day },
    { key: "1week", date: in1Week },
    { key: "1month", date: in1Month },
    { key: "3months", date: in3Months },
    { key: "6months", date: in6Months },
    { key: "1year", date: in1Year },
  ];

  return apiKey ? (
    <div>
      <p className="mb-4">
        Take a note of your API Key as you won&apos;t be able to view it again.
      </p>
      <TextInput
        label="API Key"
        value={apiKey}
        disabled
        onChange={() => ""}
        withCopy
      />
      {creds && (
        <TextInput
          label="Autoconnect URL"
          value={`${window.location.origin}/connect?uri=${creds.uri}&apikey=${apiKey}`}
          disabled
          onChange={() => ""}
          withCopy
        />
      )}
      <div className="flex justify-end mt-8">
        <Button
          variant="primary"
          className="ml-2"
          onClick={closeModal}
          disabled={isPending}
        >
          Close
        </Button>
      </div>
    </div>
  ) : (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="my-8 min-h-64 flex flex-col h-full gap-6"
    >
      <Controller
        name={"name"}
        control={control}
        disabled={isEdit}
        rules={{ required: true }}
        render={({ field }) => (
          <TextInput
            required
            label="Name"
            autoComplete="off"
            disabled={field.disabled}
            value={field.value || ""}
            onChange={(str) =>
              field.onChange(str.replaceAll(" ", "_").replaceAll("-", "_"))
            }
          />
        )}
      />
      {errors.name && <FormError text="Name is a required field." />}

      <Controller
        name={"permissions"}
        control={control}
        rules={{ required: true }}
        render={({ field }) => {
          const selected = field.value || [];

          return (
            <MultiSelect
              label="Permissions"
              labelVariant="form"
              options={options || []}
              selected={selected}
              onChange={field.onChange}
              required
            />
          );
        }}
      />
      {errors.permissions && <FormError text="Add at least one permission." />}

      <Controller
        name={"expires"}
        control={control}
        render={({ field }) => (
          <div>
            <Input
              label="Expiry Date"
              type="datetime-local"
              value={parseDateTimeForHTMLForm("datetime-local", field.value)}
              onChange={field.onChange}
            />
            <div className="space-x-1 mt-1">
              {relativeDateArr.map(({ key, date }) => {
                const d = date.minute(0).millisecond(0);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => field.onChange(date.toISOString())}
                  >
                    <Pill
                      label={d.fromNow()}
                      className={clsx(
                        field.value === date.toISOString() &&
                          "bg-brand-primary",
                      )}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs mt-1 text-manatee-500">
              {field.value
                ? `Expires ${dayjs(field.value).fromNow()} on ${formatReadableDate(field.value)}.`
                : "Never expires."}
            </p>
          </div>
        )}
      />

      {isEdit && (
        <Controller
          name={"active"}
          control={control}
          render={({ field }) => (
            <div>
              <InputLabel text="Enabled" />
              <Switch enabled={field.value} onChange={field.onChange} />
            </div>
          )}
        />
      )}

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
