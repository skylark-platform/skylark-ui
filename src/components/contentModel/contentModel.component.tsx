import { useCallback } from "react";
import { FormState, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Spinner } from "src/components/icons";
import { Toast } from "src/components/toast/toast.component";
import { useUpdateObjectTypesFieldConfig } from "src/hooks/schema/update/useUpdateObjectTypesFieldConfig";
import { useUpdateRelationshipConfig } from "src/hooks/schema/update/useUpdateRelationshipConfig";
import { useUpdateSchema } from "src/hooks/schema/update/useUpdateSchema";
import {
  ObjectTypesConfigObject,
  ObjectTypeWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import { IntrospectionQueryOptions } from "src/hooks/useSkylarkSchemaIntrospection";
import {
  ParsedSkylarkObjectTypesRelationshipConfigurations,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";
import { isAvailabilityOrAvailabilitySegment } from "src/lib/utils";

import { ObjectTypeEditor } from "./editor/contentModelEditor.component";
import {
  combineFieldRelationshipsAndFieldConfigAndSortByConfigPostion,
  ContentModelEditorForm,
} from "./editor/sections/common.component";
import { ContentModelHeader } from "./header/contentModelHeader.component";
import { ObjectTypeSelectAndOverview } from "./navigation/contentModelNavigation.component";

interface ContentModelProps {
  schemaVersion: SchemaVersion;
  activeVersionNumber: number;
  objectType: string;
  objectTypesConfig: ObjectTypesConfigObject;
  allObjectsMeta: SkylarkObjectMeta[];
  allObjectTypesRelationshipConfig: ParsedSkylarkObjectTypesRelationshipConfigurations;
}

const createFormValues = (
  allObjectsMeta: SkylarkObjectMeta[],
  objectTypesConfig: ObjectTypesConfigObject,
  allObjectTypesRelationshipConfig: ParsedSkylarkObjectTypesRelationshipConfigurations,
): ContentModelEditorForm => ({
  objectTypes: Object.fromEntries(
    allObjectsMeta.map((objectMeta) => {
      const { name, relationships } = objectMeta;

      const config = objectTypesConfig?.[name];

      const fields =
        combineFieldRelationshipsAndFieldConfigAndSortByConfigPostion(
          objectMeta.fields,
          relationships,
          config,
        );
      // const { objects: allObjectsMeta } = useAllObjectsMeta(true, schemaOpts);
      // const { objectTypesConfig, isLoading: isLoadingObjectTypesWithConfig } =
      //   useSkylarkObjectTypesWithConfig({ introspectionOpts: schemaOpts });

      console.log(name, { fields });

      return [
        name,
        {
          fields,
        },
      ];
    }),
  ),
  // allObjectTypesRelationshipConfig,
});

export const ContentModel = ({
  schemaVersion,
  activeVersionNumber,
  objectType,
  allObjectsMeta,
  objectTypesConfig,
  allObjectTypesRelationshipConfig,
}: ContentModelProps) => {
  const objectMeta = allObjectsMeta.find(
    ({ name }) => name.toLowerCase() === objectType?.toLowerCase(),
  );

  const config = objectTypesConfig?.[objectMeta?.name || ""];

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

  const { updateSchema, isUpdatingSchema } = useUpdateSchema({
    onSuccess: (newSchemaVersion) => {
      // if (newSchemaVersion.version !== selectedSchemaVersion?.version) {
      //   setSelectedSchemaVersion(newSchemaVersion);
      // }
      // push(newSchemaVersion.version)
    },
    onError: (err) => {
      console.log("Error you should handle this", err);
    },
  });

  const { updateObjectTypesFieldConfig, isUpdatingObjectTypesFieldConfig } =
    useUpdateObjectTypesFieldConfig({
      onSuccess: () => {
        form.reset(undefined, { keepValues: true });
        toast.success(
          <Toast
            title={`Object Type config updated`}
            message={[
              "You may have to refresh for the configuration changes to take effect.",
            ]}
          />,
        );
      },
      onError: () => {
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

  const onSave = (createNewSchemaVersion?: boolean) => {
    console.log("onSave");
    if (objectMeta && schemaVersion) {
      form.handleSubmit((formValues) => {
        console.log({ formValues });
        const { objectTypes } = formValues;
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
            createNewSchemaVersion:
              createNewSchemaVersion || schemaVersion.isActive,
            schemaVersion,
            formValues,
            modifiedFormFields,
          });

          updateObjectTypesFieldConfig({
            schemaVersion,
            formValues,
            modifiedFormFields,
          });
          // updateSchemaWithChanges(changedObjectTypes, dirtyFields);
        }
        // else if (
        //   form.formState.dirtyFields.relationshipConfig &&
        //   relationshipConfig
        // ) {
        //   updateRelationshipConfig({
        //     objectType: objectMeta.name,
        //     relationshipConfig,
        //   });
        // }
      })();
    }
  };

  // const isLoading =
  //   !allObjectsMeta ||
  //   isLoadingObjectTypesWithConfig ||
  //   (isLoadingRelationshipConfig &&
  //     !isAvailabilityOrAvailabilitySegment(objectMeta?.name));

  return (
    <div className="max-w-8xl mx-auto px-4 md:px-8">
      <ContentModelHeader
        activeSchemaVersion={activeVersionNumber || 0}
        schemaVersion={schemaVersion}
        isEditingSchema={form.formState.isDirty}
        isUpdatingSchema={isUpdatingSchema}
        onCancel={onCancel}
        onSave={onSave}
      />

      {allObjectsMeta && objectTypesConfig ? (
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 gap-8">
          <ObjectTypeSelectAndOverview
            activeObjectType={objectType}
            schemaVersion={schemaVersion}
            objectTypesConfig={objectTypesConfig}
          />
          {/* <div className="grid grid-cols-4 gap-4">
          <ObjectTypeNavigation
            activeObjectType={activeObjectType}
            schemaOpts={schemaOpts} */}

          <div className="md:col-span-3 xl:col-span-4 h-full">
            {objectMeta && (
              <ObjectTypeEditor
                key={`${objectType}-${config}`}
                objectMeta={objectMeta}
                objectConfig={config}
                allObjectsMeta={allObjectsMeta}
                form={form}
                schemaVersion={schemaVersion}
              />
            )}

            {objectType && !objectMeta && (
              <p className="mt-10">
                Requested Object Type &quot;
                <span className="font-medium">{objectType}</span>
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
