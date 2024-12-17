import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { FormState, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Spinner } from "src/components/icons";
import { Toast } from "src/components/toast/toast.component";
import { useSetContentModelSchemaVersion } from "src/hooks/contentModel/useSetSchemaVersion";
import { useSchemaVersions } from "src/hooks/schema/get/useSchemaVersions";
import { useUpdateObjectTypesConfiguration } from "src/hooks/schema/update/useUpdateObjectTypesConfig";
import { useUpdateRelationshipConfig } from "src/hooks/schema/update/useUpdateRelationshipConfig";
import { useUpdateRelationshipsConfigs } from "src/hooks/schema/update/useUpdateRelationshipsConfigs";
import { useUpdateSchema } from "src/hooks/schema/update/useUpdateSchema";
import { useAllObjectTypesRelationshipConfiguration } from "src/hooks/useObjectTypeRelationshipConfiguration";
import {
  ObjectTypesConfigObject,
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import { IntrospectionQueryOptions } from "src/hooks/useSkylarkSchemaIntrospection";
import {
  ParsedSkylarkObjectTypesRelationshipConfigurations,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";

import { ContentModelEditor } from "./editor/contentModelEditor.component";
import {
  combineFieldRelationshipsAndFieldConfig,
  ContentModelEditorForm,
  ContentModelEditorFormObjectTypeUiConfig,
  sortSystemFieldsFirst,
} from "./editor/sections/common.component";
import { ContentModelHeader } from "./header/contentModelHeader.component";
import { ObjectTypeSelectAndOverview } from "./navigation/contentModelNavigation.component";

interface ContentModelProps {
  activeSchemaVersionNumber: number;
  schemaVersionNumber: number | null;
  objectType: string;
}

type ContentModelComponentProps = Omit<
  ContentModelProps,
  "schemaVersionNumber"
> & {
  schemaVersion: SchemaVersion;
  objectType: string;
  objectTypesConfig: ObjectTypesConfigObject;
  allObjectsMeta: SkylarkObjectMeta[];
  allObjectTypesRelationshipConfig: ParsedSkylarkObjectTypesRelationshipConfigurations;
};

const createFormValues = (
  allObjectsMeta: SkylarkObjectMeta[],
  objectTypesConfig: ObjectTypesConfigObject,
  allObjectTypesRelationshipConfig: ParsedSkylarkObjectTypesRelationshipConfigurations,
): ContentModelEditorForm => ({
  objectTypeNames: allObjectsMeta.map(({ name }) => name) || [],
  setObjectTypeNames:
    allObjectsMeta.filter(({ isSet }) => isSet).map(({ name }) => name) || [],
  objectTypes: Object.fromEntries(
    allObjectsMeta.map((objectMeta) => {
      const { name, relationships, isSet, isBuiltIn } = objectMeta;

      const objectTypeConfiguration = objectTypesConfig?.[name];
      const relationshipsConfiguration =
        allObjectTypesRelationshipConfig?.[name];

      const fields = combineFieldRelationshipsAndFieldConfig(
        objectMeta.fields.all,
        relationships,
        // relationshipsConfiguration,
      );

      const fieldConfigs =
        objectTypeConfiguration?.fieldConfig?.reduce(
          (acc, fieldConfig) => ({
            ...acc,
            [fieldConfig.name]: { fieldType: fieldConfig.fieldType },
          }),
          {} as ContentModelEditorFormObjectTypeUiConfig["fieldConfigs"],
        ) || {};

      const uiConfig: ContentModelEditorFormObjectTypeUiConfig = {
        objectTypeDisplayName:
          objectTypeConfiguration.objectTypeDisplayName || "",
        colour: objectTypeConfiguration.colour || "",
        primaryField: objectTypeConfiguration.primaryField || "",
        fieldConfigs,
        fieldOrder:
          objectTypeConfiguration.fieldConfig
            ?.sort((fieldA, fieldB) => {
              const systemFieldSorted = sortSystemFieldsFirst(
                fieldA.name,
                fieldB.name,
              );

              if (systemFieldSorted !== 0) {
                return systemFieldSorted;
              }

              return (fieldA?.position ?? Infinity) >
                (fieldB?.position ?? Infinity)
                ? 1
                : -1;
            })
            .map(({ name }) => name) || [],
      };

      const relationshipConfigs: ContentModelEditorForm["objectTypes"][""]["relationshipConfigs"] =
        relationshipsConfiguration;

      return [
        name,
        {
          fields,
          uiConfig,
          relationshipConfigs,
          isSet,
          isBuiltIn,
        },
      ];
    }),
  ),
});

const ContentModelComponent = ({
  schemaVersion,
  activeSchemaVersionNumber,
  objectType: propObjectType,
  allObjectsMeta,
  objectTypesConfig,
  allObjectTypesRelationshipConfig,
}: ContentModelComponentProps) => {
  const { setSchemaVersion } = useSetContentModelSchemaVersion();

  const form = useForm<ContentModelEditorForm>({
    // Can't use onSubmit because we don't have a submit button within the form
    mode: "onTouched",
    // values: {
    //   fieldSections: []
    // },
    defaultValues: createFormValues(
      allObjectsMeta,
      objectTypesConfig,
      allObjectTypesRelationshipConfig,
    ),
  });

  // Sanitize object type from URL or return original to display not found error
  const objectType =
    form
      .watch("objectTypeNames")
      ?.find(
        (ot) => ot.toLocaleLowerCase() === propObjectType.toLocaleLowerCase(),
      ) || propObjectType;

  const [schemaUpdateSuccessful, setSchemaUpdateSuccessful] = useState(false);
  const [uiConfigUpdateSuccessful, setUiConfigUpdateSuccessful] =
    useState(false);
  const [
    relationshipConfigUpdateSuccessful,
    setRelationshipConfigUpdateSuccessful,
  ] = useState(false);

  const onCancel = useCallback(() => {
    form.reset(
      createFormValues(
        allObjectsMeta,
        objectTypesConfig,
        allObjectTypesRelationshipConfig,
      ),
    );
  }, [
    allObjectsMeta,
    form,
    objectTypesConfig,
    allObjectTypesRelationshipConfig,
  ]);

  // const handleEditClick = (isEditing: boolean) => {
  //   setIsEditingSchema(isEditing);
  // };

  // TODO only reset when the version changes
  // useEffect(() => {
  //   if (!form.formState.isDirty) {
  //     console.log("cancel ");
  //     onCancel();
  //   }
  // }, [allObjectsMeta, config, form, onCancel, relationshipConfig]);

  useEffect(() => {
    console.log({ schemaUpdateSuccessful, uiConfigUpdateSuccessful });
    if (
      schemaUpdateSuccessful &&
      uiConfigUpdateSuccessful // &&
      // relationshipConfigUpdateSuccessful
    ) {
      // reset values
      form.reset(form.watch(), { keepValues: true });
      setSchemaUpdateSuccessful(false);
      setUiConfigUpdateSuccessful(false);
      setRelationshipConfigUpdateSuccessful(false);
    }
  }, [
    schemaUpdateSuccessful,
    uiConfigUpdateSuccessful,
    relationshipConfigUpdateSuccessful,
  ]);

  const { updateSchema, isUpdatingSchema } = useUpdateSchema({
    onSuccess: (newSchemaVersion) => {
      setSchemaUpdateSuccessful(true);
      if (newSchemaVersion.version !== activeSchemaVersionNumber) {
        setSchemaVersion(newSchemaVersion.version);
      }
      // push(newSchemaVersion.version)
    },
    onError: (err) => {
      console.log("Error you should handle this", err);
    },
  });

  const { updateObjectTypesConfiguration, isUpdatingObjectTypesConfiguration } =
    useUpdateObjectTypesConfiguration({
      onSuccess: (modifiedObjectTypes) => {
        setUiConfigUpdateSuccessful(true);

        if (modifiedObjectTypes.length > 0) {
          toast.success(
            <Toast
              title={`Object Type config updated`}
              message={[
                "You may have to refresh for the configuration changes to take effect.",
              ]}
            />,
          );
        }
      },
      onError: (err) => {
        console.error(err);
        toast.error(
          <Toast
            title={`Object type config update failed`}
            message={[
              "Unable to update the Object Type.",
              "Please try again later.",
            ]}
          />,
        );
      },
    });

  const { updateRelationshipsConfigs, isUpdatingRelationshipsConfigs } =
    useUpdateRelationshipsConfigs({
      onSuccess: (modifiedObjectTypes) => {
        setRelationshipConfigUpdateSuccessful(true);

        if (modifiedObjectTypes.length > 0) {
          toast.success(
            <Toast
              title={`Relationship config updated`}
              message={[
                "You may have to refresh for the configuration changes to take effect.",
                "Additionally, sort field changes will only become active next time you modify the relationship.",
              ]}
            />,
          );
        }
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

  const onSave = (createNewSchemaVersion?: boolean) => {
    console.log("onSave");
    if (schemaVersion) {
      form.handleSubmit((formValues) => {
        console.log({ formValues });

        const modifiedFormFields: FormState<ContentModelEditorForm>["dirtyFields"] =
          form.formState.dirtyFields;

        console.log(modifiedFormFields);

        setSchemaUpdateSuccessful(false);
        setUiConfigUpdateSuccessful(false);
        setRelationshipConfigUpdateSuccessful(false);

        updateSchema({
          createNewSchemaVersion:
            createNewSchemaVersion || schemaVersion.isActive,
          schemaVersion,
          formValues,
          modifiedFormFields,
        });

        updateObjectTypesConfiguration({
          formValues,
          modifiedFormFields,
        });

        updateRelationshipsConfigs({
          formValues,
          modifiedFormFields,
        });
      })();
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 md:px-8">
      <ContentModelHeader
        activeSchemaVersion={activeSchemaVersionNumber || 0}
        schemaVersion={schemaVersion}
        form={form}
        isSaving={
          isUpdatingSchema ||
          isUpdatingObjectTypesConfiguration ||
          isUpdatingRelationshipsConfigs
        }
        onCancel={onCancel}
        onSave={onSave}
      />

      <ContentModelEditor
        form={form}
        objectType={objectType}
        activeSchemaVersionNumber={activeSchemaVersionNumber}
        schemaVersion={schemaVersion}
      />
    </div>
  );
};

export const ContentModel = ({
  objectType,
  activeSchemaVersionNumber,
  schemaVersionNumber,
}: ContentModelProps) => {
  const { schemaVersions } = useSchemaVersions();

  const schemaVersion: SchemaVersion | null =
    schemaVersionNumber === null
      ? typeof activeSchemaVersionNumber === "number"
        ? {
            version: activeSchemaVersionNumber,
            baseVersion: -1,
            isDraft: false,
            isPublished: true,
            isActive: true,
          }
        : null
      : schemaVersions?.find(
          ({ version }) => version === schemaVersionNumber,
        ) || null;

  const schemaOpts: IntrospectionQueryOptions | undefined =
    schemaVersion !== null &&
    schemaVersion !== undefined &&
    schemaVersion?.version !== activeSchemaVersionNumber
      ? {
          schemaVersion: schemaVersion.version,
        }
      : undefined;

  const { objects: allObjectsMeta } = useAllObjectsMeta(true, schemaOpts);
  const { objectTypesConfig, isLoading: isLoadingObjectTypesWithConfig } =
    useSkylarkObjectTypesWithConfig({ introspectionOpts: schemaOpts });

  const {
    allObjectTypesRelationshipConfig,
    isLoading: isLoadingRelationshipConfig,
  } = useAllObjectTypesRelationshipConfiguration();

  return (
    <>
      {schemaVersion &&
      typeof activeSchemaVersionNumber === "number" &&
      objectType &&
      allObjectsMeta &&
      objectTypesConfig &&
      allObjectTypesRelationshipConfig &&
      !isLoadingObjectTypesWithConfig &&
      !isLoadingRelationshipConfig ? (
        <ContentModelComponent
          key={schemaVersion.version}
          schemaVersion={schemaVersion}
          objectType={objectType}
          activeSchemaVersionNumber={activeSchemaVersionNumber}
          allObjectsMeta={allObjectsMeta}
          objectTypesConfig={objectTypesConfig}
          allObjectTypesRelationshipConfig={allObjectTypesRelationshipConfig}
        />
      ) : (
        <div className="flex justify-center w-full mt-20 items-center">
          <Spinner className="h-14 w-14 animate-spin" />
        </div>
      )}
    </>
  );
};
