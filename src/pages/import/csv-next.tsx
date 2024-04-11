import DromoUploader, { IResultMetadata } from "dromo-uploader-react";
import { useState, useReducer, ReactNode } from "react";
import { FiDownload, FiUpload } from "react-icons/fi";

import { Button } from "src/components/button";
import { LanguageSelect, ObjectTypeSelect } from "src/components/inputs/select";
import { StatusCard, statusType } from "src/components/statusCard";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";
import { SkylarkCreds } from "src/hooks/useConnectedToSkylark";
import {
  ObjectTypeWithConfig,
  useAllObjectsMeta,
  useSkylarkObjectOperations,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  BuiltInSkylarkObjectType,
  ParsedSkylarkDimensionsWithValues,
  ParsedSkylarkObjectConfig,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";
import { createDromoRowHooks } from "src/lib/dromo/rowHooks";
import {
  convertAvailabilityObjectMetaToDromoSchemaFields,
  convertObjectMetaToDromoSchemaFields,
} from "src/lib/dromo/schema";
import { getDromoSettings } from "src/lib/dromo/settings";
import {
  createDromoObjectsInSkylark,
  generateExampleCSV,
} from "src/lib/flatfile";
import { createSkylarkClient } from "src/lib/graphql/skylark/client";
import { createAccountIdentifier, pause } from "src/lib/utils";

type ImportStates = "select" | "prep" | "import" | "create";

const orderedStates = ["select", "prep", "import", "create"] as ImportStates[];

const copyText: {
  [key in ImportStates]: {
    title: string;
    messages: {
      [key in "pending" | "success" | "inProgress" | "error"]: string;
    };
  };
} = {
  select: {
    title: "Select object type",
    messages: {
      pending: "Choose the Skylark object type to import",
      inProgress: "",
      success: "You have selected {objectType}{selectedLanguageStr}",
      error: "",
    },
  },
  prep: {
    title: "Pre-import tasks",
    messages: {
      pending: "Update import service",
      inProgress: "Fine tuning the import service...",
      success: "Ready for CSV import",
      error: "Error updating the import service",
    },
  },
  import: {
    title: "Import",
    messages: {
      pending: "Import your CSV",
      inProgress: "Opening CSV importer...",
      success: "CSV imported successfully",
      error: "Error using import service",
    },
  },
  create: {
    title: "Create objects in Skylark",
    messages: {
      pending: "Your imported data will be created",
      inProgress:
        "{objectType} objects being created in Skylark. Do not refresh the page...",
      success:
        "{numCreated} {objectType} objects have been successfully imported into Skylark",
      error:
        "Error creating {numErrored} {objectType} objects ({numCreated}/{totalImportedToFlatfile} created). Check the console or try again.",
    },
  },
};

const initialState: {
  [key in ImportStates]: statusType;
} = {
  select: statusType.pending,
  prep: statusType.pending,
  import: statusType.pending,
  create: statusType.pending,
};

function reducer(
  state: { [key in ImportStates]: statusType },
  action: { stage: ImportStates; status: statusType } | { stage: "reset" },
) {
  if (action.stage === "reset")
    return { ...initialState, select: statusType.success };

  return {
    ...state,
    [action.stage]: action.status,
  };
}

const createObjectsInSkylark = async (
  objectMeta: SkylarkObjectMeta,
  data: Record<string, SkylarkObjectMetadataField>[],
  dromoImportMetadata: IResultMetadata,
  creds: SkylarkCreds | null,
  language: string | null,
  setStatus: (status: statusType) => void,
  setObjectAmounts: (a: { numCreated: number; numErrored: number }) => void,
) => {
  setStatus(statusType.inProgress);
  if (!creds?.uri || !creds?.token) {
    setStatus(statusType.error);
    throw new Error(
      "Skylark GraphQL URI or Access Key not found in local storage",
    );
  }

  try {
    const skylarkClient = createSkylarkClient(creds.uri, creds.token);

    const skylarkObjects = await createDromoObjectsInSkylark(
      skylarkClient,
      objectMeta,
      data,
      dromoImportMetadata,
      language,
    );

    setObjectAmounts({
      numCreated: skylarkObjects.data.length,
      numErrored: skylarkObjects.errors.length,
    });
    if (skylarkObjects.errors.length > 0) {
      console.error("Errors creating objects:", skylarkObjects.errors);
      setStatus(statusType.error);
    } else {
      setStatus(statusType.success);
    }
  } catch (err) {
    console.error(err);
    setObjectAmounts({
      numCreated: 0,
      numErrored: data.length,
    });
    setStatus(statusType.inProgress);
  }
};

const TemplateCSVDownloadButton = ({
  objectTypeDisplayName,
  objectMeta,
  dimensions,
  disabled,
  children,
  translatableFieldsOnly,
}: {
  objectTypeDisplayName: string;
  objectMeta: SkylarkObjectMeta | null;
  dimensions?: ParsedSkylarkDimensionsWithValues[];
  disabled?: boolean;
  children: ReactNode;
  translatableFieldsOnly?: boolean;
}) => {
  const templateCSV =
    objectMeta && !disabled
      ? generateExampleCSV(
          objectMeta,
          translatableFieldsOnly || false,
          true,
          dimensions,
        )
      : null;

  const downloadName = `${objectTypeDisplayName.replaceAll(" ", "_")}_${translatableFieldsOnly ? "translatable_fields" : "full"}_template.csv`;

  return (
    <Button
      variant="link"
      href={
        !disabled && templateCSV
          ? "data:text/plain;charset=utf-8," +
            encodeURIComponent(templateCSV as string)
          : undefined
      }
      downloadName={downloadName}
      disabled={disabled || !templateCSV}
      Icon={<FiDownload className="text-xl" />}
    >
      {children}
    </Button>
  );
};

const GenericObjectDromo = ({
  accountIdentifier,
  objectMeta,
  objectTypesWithConfig,
  allObjectsMeta,
  onCancel,
  onResults,
}: {
  accountIdentifier: string;
  objectMeta: SkylarkObjectMeta;
  allObjectsMeta: SkylarkObjectMeta[];
  objectTypesWithConfig?: ObjectTypeWithConfig[];
  onCancel: () => void;
  onResults: (
    objectMeta: SkylarkObjectMeta,
    data: Record<string, SkylarkObjectMetadataField>[],
    metadata: IResultMetadata,
  ) => void;
}) => {
  const objectTypeWithConfig = objectTypesWithConfig?.find(
    ({ objectType }) => objectMeta.name === objectType,
  ) || { objectType: objectMeta.name, config: {} };

  const settings = getDromoSettings(objectTypeWithConfig, accountIdentifier);

  const fields = convertObjectMetaToDromoSchemaFields(objectMeta);

  const onResultsWrapper = (
    data: Record<string, SkylarkObjectMetadataField>[],
    metadata: IResultMetadata,
  ) => {
    onResults(objectMeta, data, metadata);
  };

  console.log("triggered dromo", { settings, fields });

  const isDevelopmentMode = true;

  return (
    <DromoUploader
      key="dromo"
      open={true}
      onCancel={onCancel}
      onResults={onResultsWrapper}
      developmentMode={isDevelopmentMode}
      licenseKey={"bace02ef-7319-4911-a3ce-5a3cc3d79df9"}
      user={{ id: accountIdentifier }}
      fields={fields}
      settings={settings}
      rowHooks={
        objectMeta.name !== BuiltInSkylarkObjectType.Availability
          ? createDromoRowHooks(
              objectMeta,
              allObjectsMeta,
              objectTypesWithConfig,
            )
          : undefined
      }
      beforeFinish={
        isDevelopmentMode ||
        objectMeta.name !== BuiltInSkylarkObjectType.Availability
          ? undefined
          : (data) => {
              if (data.length < 5) {
                return {
                  cancel: true,
                  message: "You must import at least 5 rows",
                };
              }
            }
      }
    />
  );
};

const AvailabilityDromo = ({
  accountIdentifier,
  objectMeta,
  objectTypesWithConfig,
  allObjectsMeta,
  availabilityDimensionsWithValues,
  onCancel,
  onResults,
}: {
  accountIdentifier: string;
  objectMeta: SkylarkObjectMeta;
  allObjectsMeta: SkylarkObjectMeta[];
  objectTypesWithConfig?: ObjectTypeWithConfig[];
  availabilityDimensionsWithValues: ParsedSkylarkDimensionsWithValues[];
  onCancel: () => void;
  onResults: (
    objectMeta: SkylarkObjectMeta,
    data: Record<string, SkylarkObjectMetadataField>[],
    metadata: IResultMetadata,
  ) => void;
}) => {
  const objectTypeWithConfig = objectTypesWithConfig?.find(
    ({ objectType }) => objectMeta.name === objectType,
  ) || { objectType: objectMeta.name, config: {} };

  const settings = getDromoSettings(objectTypeWithConfig, accountIdentifier);

  const fields = convertAvailabilityObjectMetaToDromoSchemaFields(
    objectMeta,
    availabilityDimensionsWithValues,
  );

  console.log({ fields });

  const onResultsWrapper = (
    data: Record<string, SkylarkObjectMetadataField>[],
    metadata: IResultMetadata,
  ) => {
    onResults(objectMeta, data, metadata);
  };

  console.log("triggered dromo", { settings, fields });

  const isDevelopmentMode = true;

  return (
    <DromoUploader
      key="dromo"
      open={true}
      onCancel={onCancel}
      onResults={onResultsWrapper}
      developmentMode={isDevelopmentMode}
      licenseKey={"bace02ef-7319-4911-a3ce-5a3cc3d79df9"}
      user={{ id: accountIdentifier }}
      fields={fields}
      settings={settings}
      rowHooks={
        objectMeta.name !== BuiltInSkylarkObjectType.Availability
          ? createDromoRowHooks(
              objectMeta,
              allObjectsMeta,
              objectTypesWithConfig,
            )
          : undefined
      }
      beforeFinish={
        isDevelopmentMode ||
        objectMeta.name !== BuiltInSkylarkObjectType.Availability
          ? undefined
          : (data) => {
              if (data.length < 5) {
                return {
                  cancel: true,
                  message: "You must import at least 5 rows",
                };
              }
            }
      }
    />
  );
};

export default function CSVImportPage() {
  const [{ objectType, config: objectTypeConfig }, setObjectTypeWithConfig] =
    useState<{ objectType: string; config?: ParsedSkylarkObjectConfig }>({
      objectType: "",
    });

  const objectTypeDisplayName =
    objectTypeConfig?.objectTypeDisplayName || objectType;

  const [language, setLanguage] = useState<string | undefined>();

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  // const { data: allObjects } = useListAllObjects();

  const { dimensions, isLoading: isLoadingDimensions } =
    useAvailabilityDimensionsWithValues({
      enabled: objectType === BuiltInSkylarkObjectType.Availability,
    });

  console.log({ dimensions, isLoadingDimensions });

  const { objects: allObjectsMeta } = useAllObjectsMeta(true);

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const [state, dispatch] = useReducer(reducer, initialState);

  const [showDromo, setShowDromo] = useState(false);

  const [
    { numCreated, numErrored, totalImportedToFlatfile },
    setObjectAmounts,
  ] = useState({
    totalImportedToFlatfile: 0,
    numCreated: 0,
    numErrored: 0,
  });

  const [creds] = useSkylarkCreds();

  const onClick = async () => {
    if (!objectOperations) {
      return;
    }

    dispatch({ stage: "prep", status: statusType.inProgress });

    if (!creds) {
      dispatch({ stage: "prep", status: statusType.error });
      throw new Error(
        "Skylark GraphQL URI or Access Key not found in local storage",
      );
    }

    dispatch({ stage: "prep", status: statusType.success });
    await pause(500); // Reflect state on client side, then open

    dispatch({ stage: "import", status: statusType.inProgress });
    setShowDromo(true);
  };

  const onCancel = () => {
    dispatch({ stage: "reset" });
    setShowDromo(false);
  };

  const onResults = (
    objectMeta: SkylarkObjectMeta,
    data: Record<string, SkylarkObjectMetadataField>[],
    metadata: IResultMetadata,
  ) => {
    console.log("onResults", { data, metadata });
    dispatch({ stage: "import", status: statusType.success });
    setShowDromo(false);
    createObjectsInSkylark(
      objectMeta,
      data,
      metadata,
      creds,
      language || null,
      (status) => {
        dispatch({ stage: "create", status });
      },
      ({ numCreated, numErrored }) => {
        setObjectAmounts({
          totalImportedToFlatfile: data.length,
          numCreated,
          numErrored,
        });
      },
    );
  };

  return (
    <div className="flex h-full w-full flex-col sm:flex-row">
      <section className="flex w-full flex-col space-y-3 p-10 pb-6 pt-24 sm:w-1/2 sm:space-y-5 md:px-20 md:pt-48 lg:w-1/2 xl:w-2/5 xl:px-24 2xl:w-1/3 2xl:px-28">
        <h2 className="font-heading text-2xl font-bold md:text-3xl">
          Import from CSV
        </h2>
        <ObjectTypeSelect
          variant="primary"
          selected={objectType}
          placeholder="Select Skylark object"
          label="Select your Skylark object type"
          onChange={(value) => {
            setObjectTypeWithConfig(value);
            dispatch({ stage: "select", status: statusType.success });
          }}
          disabled={state.prep !== statusType.pending}
        />
        {objectType !== BuiltInSkylarkObjectType.Availability && (
          <LanguageSelect
            useDefaultLanguage
            variant="primary"
            rounded={false}
            selected={language}
            onChange={setLanguage}
            disabled={state.prep !== statusType.pending || !allObjectsMeta}
          />
        )}
        <Button
          block
          variant="primary"
          disabled={
            !objectType ||
            !objectOperations ||
            state.prep !== statusType.pending ||
            (objectType === BuiltInSkylarkObjectType.Availability &&
              isLoadingDimensions)
          }
          loading={
            objectType === BuiltInSkylarkObjectType.Availability &&
            isLoadingDimensions
          }
          onClick={onClick}
          Icon={<FiUpload className="text-xl" />}
        >
          Import
        </Button>
        <div className="text-center">
          <TemplateCSVDownloadButton
            objectMeta={objectOperations}
            objectTypeDisplayName={objectTypeDisplayName}
            dimensions={dimensions}
            disabled={
              !objectType ||
              !objectOperations ||
              state.prep !== statusType.pending ||
              (objectType === BuiltInSkylarkObjectType.Availability &&
                !dimensions)
            }
          >
            Download Full Template
          </TemplateCSVDownloadButton>
          {objectType !== BuiltInSkylarkObjectType.Availability && (
            <TemplateCSVDownloadButton
              objectMeta={objectOperations}
              objectTypeDisplayName={objectTypeDisplayName}
              disabled={
                !objectType ||
                !objectOperations ||
                state.prep !== statusType.pending
              }
              translatableFieldsOnly
            >
              Download Translatable Fields Template
            </TemplateCSVDownloadButton>
          )}

          {/* {objectType !== BuiltInSkylarkObjectType.Availability && (
            <Button
              variant="link"
              href={
                "data:text/plain;charset=utf-8," +
                encodeURIComponent(translationTemplateCSV as string)
              }
              downloadName={`${objectTypeDisplayName
                .split(" ")
                .join("_")}_example.csv`}
              disabled={
                !translationTemplateCSV ||
                !objectType ||
                !objectOperations ||
                state.prep !== statusType.pending
              }
              Icon={<FiDownload className="text-xl" />}
            >
              Download Translatable Fields Template
            </Button>
          )} */}
        </div>
      </section>
      <section className="flex flex-grow flex-col items-center justify-center bg-gray-200 py-10">
        <div className="flex w-5/6 flex-col items-center justify-center space-y-2 md:space-y-3 lg:w-3/5 xl:w-1/2 2xl:w-1/3">
          {orderedStates.map((card) => {
            const copyCard = copyText[card];
            const status = state[card];

            return (
              <StatusCard
                key={copyCard.title}
                title={copyCard.title}
                description={copyCard.messages[status]
                  .replace("{objectType}", objectTypeDisplayName)
                  .replace(
                    "{selectedLanguageStr}",
                    language ? ` in ${language}` : "",
                  )
                  .replace(
                    "{totalImportedToFlatfile}",
                    totalImportedToFlatfile.toString(),
                  )
                  .replace("{numCreated}", numCreated.toString())
                  .replace("{numErrored}", numErrored.toString())}
                status={status}
              />
            );
          })}
          <div className="flex w-full flex-row justify-end space-x-2">
            <Button
              href={`/`}
              variant="primary"
              disabled={state.create !== statusType.success}
            >
              Start curating
            </Button>

            <Button
              onClick={() => dispatch({ stage: "reset" })}
              variant="outline"
              disabled={
                state.create !== statusType.success &&
                state.create !== statusType.error
              }
            >
              New import
            </Button>
          </div>
        </div>
      </section>
      {objectOperations && allObjectsMeta && creds && showDromo && (
        <>
          {objectType !== BuiltInSkylarkObjectType.Availability && (
            <GenericObjectDromo
              accountIdentifier={createAccountIdentifier(creds.uri)}
              objectMeta={objectOperations}
              allObjectsMeta={allObjectsMeta}
              objectTypesWithConfig={objectTypesWithConfig}
              onResults={onResults}
              onCancel={onCancel}
            />
          )}
          {dimensions &&
            objectType === BuiltInSkylarkObjectType.Availability && (
              <AvailabilityDromo
                accountIdentifier={createAccountIdentifier(creds.uri)}
                objectMeta={objectOperations}
                allObjectsMeta={allObjectsMeta}
                objectTypesWithConfig={objectTypesWithConfig}
                availabilityDimensionsWithValues={dimensions}
                onResults={onResults}
                onCancel={onCancel}
              />
            )}
        </>
      )}
    </div>
  );
}
