import { pascalCase, snakeCase } from "change-case";
import React, { ForwardedRef, forwardRef, useRef } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "src/components/button";
import { Checkbox } from "src/components/inputs/checkbox";
import { TextInput } from "src/components/inputs/input";
import { Select } from "src/components/inputs/select";
import {
  Modal,
  ModalDescription,
  ModalTitle,
} from "src/components/modals/base/modal";

export type CreateObjectTypeModalForm = {
  name: string;
  type: "object" | "set";
};

interface CreateObjectTypeModalProps {
  isOpen: boolean;
  setIsOpen: (b: boolean) => void;
  onSubmit: (f: CreateObjectTypeModalForm) => void;
}

const CreateObjectTypeModalBody = forwardRef(
  (
    {
      onSubmit,
      closeModal,
    }: Omit<CreateObjectTypeModalProps, "isOpen" | "setIsOpen"> & {
      closeModal: () => void;
    },
    ref: ForwardedRef<HTMLInputElement>,
  ) => {
    const submitButtonRef = useRef<HTMLButtonElement | null>(null);

    const form = useForm<CreateObjectTypeModalForm>({
      defaultValues: { name: "", type: "object" },
    });

    const { handleSubmit, watch, control, formState, setValue } = form;

    return (
      <>
        <ModalTitle>{"Add Object Type"}</ModalTitle>
        <ModalDescription>
          Fields can only be created or deleted. Editing only supported for
          field config.
        </ModalDescription>
        <form
          className="mt-8 flex w-full flex-col h-full justify-start"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="w-full h-full flex flex-grow gap-4 flex-col">
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <>
                    <TextInput
                      label="Name (Pascal case e.g. MyObjectType)"
                      {...field}
                      ref={ref}
                      required
                      onChange={(str) => field.onChange(pascalCase(str))}
                    />
                    <p className="text-manatee-300">{`Name given to GraphQL (converted to Snake case): ${snakeCase(field.value)}`}</p>
                  </>
                );
              }}
            />
            <Controller
              name="type"
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <Select
                    label="Type"
                    labelVariant="form"
                    variant="primary"
                    placeholder=""
                    options={[
                      { label: "Object", value: "object" },
                      { label: "Set", value: "set" },
                    ]}
                    selected={field.value}
                    onChange={(value) => field.onChange(value)}
                  />
                );
              }}
            />
          </div>

          <div className="flex justify-between mt-4 self-end">
            <div className="space-x-2 flex">
              <Button
                ref={submitButtonRef}
                variant="primary"
                type="submit"
                disabled={Object.keys(formState.dirtyFields).length === 0}
                success
              >
                {"Add"}
              </Button>
              <Button
                variant="outline"
                type="button"
                danger
                onClick={closeModal}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </>
    );
  },
);
CreateObjectTypeModalBody.displayName = "CreateObjectTypeModalBody";

export const CreateObjectTypeModal = ({
  isOpen,
  setIsOpen,
  ...props
}: CreateObjectTypeModalProps) => {
  const nameRef = useRef(null);

  return (
    <Modal
      initialFocus={nameRef}
      title={null}
      isOpen={isOpen}
      closeModal={() => setIsOpen(false)}
      data-testid="edit-object-field-modal"
      size="medium"
      growHeight
    >
      {isOpen && (
        <CreateObjectTypeModalBody
          {...props}
          ref={nameRef}
          closeModal={() => setIsOpen(false)}
        />
      )}
    </Modal>
  );
};
