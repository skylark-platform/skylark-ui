import { Dialog } from "@headlessui/react";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { GrClose } from "react-icons/gr";

import { Button } from "src/components/button";
import { LanguageSelect, Select } from "src/components/select";
import { useCreateObject } from "src/hooks/useCreateObject";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import { SkylarkObjectIdentifier } from "src/interfaces/skylark";

interface CreateObjectModalProps {
  isOpen: boolean;
  setIsOpen: (b: boolean) => void;
  onObjectCreated: (o: SkylarkObjectIdentifier) => void;
}

export const CreateObjectModal = ({
  isOpen,
  setIsOpen,
  onObjectCreated,
}: CreateObjectModalProps) => {
  const { objectTypes } = useSkylarkObjectTypes();
  const { handleSubmit, watch, control } = useForm<{
    objectType: string;
    language: string;
  }>();

  const closeModal = () => {
    setIsOpen(false);
  };

  const objectType = watch("objectType");

  const { createObject, isLoading: isCreatingObject } = useCreateObject({
    objectType,
    onSuccess: (object) => {
      onObjectCreated?.(object);
    },
  });

  const onSubmit = ({ language }: { objectType: string; language: string }) =>
    createObject(language);

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      className="font-body relative z-50"
    >
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        data-testid="dialog-background"
      />

      <div className="fixed inset-0 flex items-center justify-center p-2 text-sm">
        <Dialog.Panel className="relative mx-auto max-w-lg rounded bg-white p-6 md:p-10">
          <button
            aria-label="close"
            className="absolute top-4 right-4 sm:top-9 sm:right-8"
            onClick={closeModal}
            tabIndex={-1}
          >
            <GrClose className="text-xl" />
          </button>

          <Dialog.Title className="mb-2 font-heading text-2xl md:mb-4 md:text-3xl">
            Create Object
          </Dialog.Title>
          <Dialog.Description>
            Create a blank object and opens it in the panel
          </Dialog.Description>
          <div className="my-2 flex flex-col space-y-2 md:my-4">
            <p>
              Currently, the object will be created empty with only required
              fields filled (if no fields are required, one will be selected at
              random).
            </p>
            <p>The Panel can then be used to edit the object.</p>
          </div>
          <form
            className="mt-8 flex w-full flex-col justify-end gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              name="objectType"
              control={control}
              render={({ field }) => (
                <Select
                  className="w-full"
                  variant="primary"
                  disabled={!objectTypes}
                  selected={(field.value as string) || ""}
                  placeholder="Select Skylark Object Type"
                  options={
                    objectTypes?.map((opt) => ({
                      value: opt,
                      label: opt,
                    })) || []
                  }
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="language"
              control={control}
              render={({ field }) => (
                <LanguageSelect
                  className="w-full"
                  variant="primary"
                  rounded={false}
                  disabled={!objectTypes}
                  selected={(field.value as string) || ""}
                  onChange={field.onChange}
                />
              )}
            />
            <Button
              variant="primary"
              className="mt-2"
              loading={isCreatingObject}
              type="submit"
            >
              Create object
            </Button>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
