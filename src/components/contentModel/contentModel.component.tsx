import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormState, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Spinner } from "src/components/icons";
import { Toast } from "src/components/toast/toast.component";
import { useCreateSchemaVersion } from "src/hooks/schema/create/useCreateSchemaVersion";
import { useUpdateRelationshipConfig } from "src/hooks/schema/update/useUpdateRelationshipConfig";
import { useUpdateSchema } from "src/hooks/schema/update/useUpdateSchema";
import { useActivationStatus } from "src/hooks/useAccountStatus";
import { useObjectTypeRelationshipConfiguration } from "src/hooks/useObjectTypeRelationshipConfiguration";
import {
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import { IntrospectionQueryOptions } from "src/hooks/useSkylarkSchemaIntrospection";
import {
  BuiltInSkylarkObjectType,
  NormalizedObjectField,
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";

import { ObjectTypeEditor } from "./editor/contentModelEditor.component";
import {
  ContentModelEditorForm,
  createFieldSections,
  splitFieldsIntoSystemGlobalTranslatable,
} from "./editor/sections/common.component";
import { ContentModelHeader } from "./header/contentModelHeader.component";
import { ObjectTypeSelectAndOverview } from "./navigation/contentModelNavigation.component";

export const ContentModel = () => {
  const { query } = useRouter();

  const { activationStatus } = useActivationStatus();
  const [selectedSchemaVersionState, setSelectedSchemaVersion] =
    useState<SchemaVersion | null>(null);

  const selectedSchemaVersion: SchemaVersion | null =
    selectedSchemaVersionState === null
      ? activationStatus?.activeVersion
        ? {
            version: activationStatus.activeVersion,
            baseVersion: -1,
            isDraft: false,
            isPublished: true,
            isActive: true,
          }
        : null
      : selectedSchemaVersionState;

  const schemaOpts: IntrospectionQueryOptions | undefined =
    selectedSchemaVersion !== null &&
    selectedSchemaVersion !== undefined &&
    selectedSchemaVersion?.version !== activationStatus?.activeVersion
      ? {
          schemaVersion: selectedSchemaVersion.version,
        }
      : undefined;

  const { objects: allObjectsMeta } = useAllObjectsMeta(true, schemaOpts);
  const { objectTypesWithConfig, isLoading: isLoadingObjectTypesWithConfig } =
    useSkylarkObjectTypesWithConfig(schemaOpts);

  const activeObjectType = (query?.objectType?.[0] as string) || null;

  const objectMeta = allObjectsMeta?.find(
    ({ name }) => name.toLowerCase() === activeObjectType?.toLowerCase(),
  );

  const config = objectTypesWithConfig?.find(
    ({ objectType }) => objectType === objectMeta?.name,
  )?.config;

  const {
    objectTypeRelationshipConfig: relationshipConfig,
    isLoading: isLoadingRelationshipConfig,
  } = useObjectTypeRelationshipConfiguration(objectMeta?.name || null);

  const isLoading =
    !allObjectsMeta ||
    isLoadingObjectTypesWithConfig ||
    (isLoadingRelationshipConfig &&
      objectMeta?.name !== BuiltInSkylarkObjectType.Availability);

  const [isEditingSchema, setIsEditingSchema] = useState(false);

  const form = useForm<ContentModelEditorForm>({
    // Can't use onSubmit because we don't have a submit button within the form
    mode: "onTouched",
    // values: {
    //   fieldSections: []
    // },
  });

  const handleEditClick = (isEditing: boolean) => {
    setIsEditingSchema(isEditing);
  };

  useEffect(() => {
    if (!isEditingSchema && allObjectsMeta && config)
      form.reset({
        objectTypes: Object.fromEntries(
          allObjectsMeta.map((objectMeta) => {
            const { name, relationships } = objectMeta;

            const fields: ContentModelEditorForm["objectTypes"][0]["fields"] =
              splitFieldsIntoSystemGlobalTranslatable(objectMeta);

            return [
              name,
              {
                fields,
                relationships,
              },
            ];
          }),
        ),
        relationshipConfig,
      });
  }, [allObjectsMeta, config, form, isEditingSchema, relationshipConfig]);

  const { updateSchema, isUpdatingSchema } = useUpdateSchema({
    onSuccess: (newSchemaVersion) => {
      if (newSchemaVersion.version !== selectedSchemaVersion?.version) {
        setSelectedSchemaVersion(newSchemaVersion);
      }
    },
    onError: (err) => {
      console.log("Error you should handle this", err);
    },
  });

  const { updateRelationshipConfig, isUpdatingRelationshipConfig } =
    useUpdateRelationshipConfig({
      onSuccess: () => {
        form.reset(undefined, { keepValues: true });
        toast.success(
          <Toast
            title={`Relationship config updated`}
            message={[
              "You may have to refresh for the configuration changes to take effect.",
              "Additionally, sort field changes will only become active next time you modify the relationship.",
            ]}
          />,
        );
      },
      onError: (e) => {
        const reverseInheritAvailabilityErrorMessage =
          "reverse relationship already inherits";

        const otherErrors = e.response.errors.filter(
          ({ message }) =>
            message.toLowerCase() !== reverseInheritAvailabilityErrorMessage,
        );
        const inheritAvailabilityErrs = e.response.errors.filter(
          ({ message }) =>
            message.toLowerCase() === reverseInheritAvailabilityErrorMessage,
        );

        if (inheritAvailabilityErrs.length > 0) {
          const inheritAvailabilityReverseMessage =
            'Cannot enable "inherit availability" on the following relationships as it is enabled on the reverse relationship.';

          const formattedErrs = inheritAvailabilityErrs.map(
            (err) => ` - ${err.path[0].split("_")[1]}`,
          );

          toast.error(
            <Toast
              title={`Relationship config update failed`}
              message={[inheritAvailabilityReverseMessage, ...formattedErrs]}
            />,
          );
        }

        if (otherErrors.length > 0) {
          toast.error(
            <Toast
              title={`Relationship config update failed`}
              message={[
                "Error when updating the Relationship config.",
                "Please try again later.",
                ...otherErrors.map((error) => `- ${error.message}`),
              ]}
            />,
          );
        }
      },
    });

  const onSave = () => {
    if (objectMeta && selectedSchemaVersion) {
      form.handleSubmit((formValues) => {
        const { objectTypes, relationshipConfig } = formValues;
        const schemaChangesDetected = form.formState.dirtyFields.objectTypes;

        if (schemaChangesDetected) {
          console.log(
            "SchemaChangesDetected",
            objectTypes,
            schemaChangesDetected,
          );

          const modifiedFormFields: FormState<ContentModelEditorForm>["dirtyFields"] =
            form.formState.dirtyFields;

          updateSchema({
            createNewSchemaVersion: selectedSchemaVersion.isActive,
            schemaVersion: selectedSchemaVersion,
            formValues,
            modifiedFormFields,
          });

          // updateSchemaWithChanges(changedObjectTypes, dirtyFields);
        } else if (
          form.formState.dirtyFields.relationshipConfig &&
          relationshipConfig
        ) {
          updateRelationshipConfig({
            objectType: objectMeta.name,
            relationshipConfig,
          });
        }
      })();
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 md:px-8">
      <ContentModelHeader
        activeSchemaVersion={activationStatus?.activeVersion || 0}
        schemaVersion={selectedSchemaVersion}
        setSchemaVersion={setSelectedSchemaVersion}
        isEditingSchema={isEditingSchema}
        isUpdatingSchema={isUpdatingSchema}
        setIsEditingSchema={handleEditClick}
        onSave={onSave}
      />

      {allObjectsMeta && objectTypesWithConfig ? (
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 gap-8">
          <ObjectTypeSelectAndOverview
            activeObjectType={activeObjectType}
            schemaOpts={schemaOpts}
          />

          <div className="md:col-span-3 xl:col-span-4 h-full">
            {objectMeta && !isLoading && (
              <ObjectTypeEditor
                key={`${activeObjectType}-${config}`}
                isEditingSchema={isEditingSchema}
                objectMeta={objectMeta}
                objectConfig={config}
                allObjectsMeta={allObjectsMeta}
                form={form}
              />
            )}
            {isLoading && (
              <div className="flex justify-center w-full mt-20 items-center">
                <Spinner className="h-14 w-14 animate-spin" />
              </div>
            )}
            {!isLoading && activeObjectType && !objectMeta && (
              <p className="mt-10">
                Requested Object Type &quot;
                <span className="font-medium">{activeObjectType}</span>
                &quot; does not exist in this schema version.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex mt-32 justify-center w-full h-full items-center">
          <Spinner className="h-14 w-14 animate-spin" />
        </div>
      )}
    </div>
  );
};
