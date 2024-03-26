import dayjs from "dayjs";
import DromoUploader, { IResultMetadata } from "dromo-uploader-react";
import { useState, useReducer } from "react";
import { FiDownload, FiUpload } from "react-icons/fi";

import { Button } from "src/components/button";
import { ObjectTypeSelect } from "src/components/inputs/select";
import { StatusCard, statusType } from "src/components/statusCard";
import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";
import { SkylarkCreds } from "src/hooks/useConnectedToSkylark";
import {
  ObjectTypeWithConfig,
  useAllObjectsMeta,
  useSkylarkObjectOperations,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectConfig,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { createDromoRowHooks } from "src/lib/dromo/rowHooks";
import {
  DromoSchema,
  convertObjectInputToDromoSchemaFields,
  convertRelationshipsToDromoSchemaFields,
} from "src/lib/dromo/schema";
import {
  createDromoObjectsInSkylark,
  generateExampleCSV,
} from "src/lib/flatfile";
import { createSkylarkClient } from "src/lib/graphql/skylark/client";
import { createAccountIdentifier, pause } from "src/lib/utils";

type ImportStates = "select" | "prep" | "import" | "create";

const orderedStates = ["select", "prep", "import", "create"] as ImportStates[];

// Import UID to use when creating objects
// 504c3c43-4cf1-46dd-bdd2-fd109350946c

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
      success: "You have selected {objectType}",
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

const Dromo = ({
  show,
  accountIdentifier,
  objectMeta,
  objectTypesWithConfig,
  allObjectsMeta,
  onCancel,
  onResults,
}: {
  show: boolean;
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
  const metadataFields = convertObjectInputToDromoSchemaFields(
    objectMeta.operations.create.inputs,
    objectMeta.relationships,
  );

  const relationshipFields: DromoSchema["fields"] = objectMeta.relationships
    ? convertRelationshipsToDromoSchemaFields(
        objectMeta.relationships,
        {},
        objectTypesWithConfig || [],
      )
    : [];

  const settings: DromoSchema["settings"] = {
    importIdentifier: `${accountIdentifier}-${objectMeta.name}-${dayjs().format("YYYY_MM_DD__HH_mm")}`,
    title: objectMeta.name,
    allowCustomFields: false,
  };

  const onResultsWrapper = (
    data: Record<string, SkylarkObjectMetadataField>[],
    metadata: IResultMetadata,
  ) => {
    onResults(objectMeta, data, metadata);
  };

  return (
    <DromoUploader
      open={show}
      onCancel={onCancel}
      onResults={onResultsWrapper}
      developmentMode
      licenseKey={"bace02ef-7319-4911-a3ce-5a3cc3d79df9"}
      user={{ id: "jw" }}
      fields={[...metadataFields, ...relationshipFields]}
      settings={settings}
      rowHooks={createDromoRowHooks(
        objectMeta,
        allObjectsMeta,
        objectTypesWithConfig,
      )}
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

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  // const { data: allObjects } = useListAllObjects();

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

  const exampleCSV = generateExampleCSV(objectOperations);

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
        <Button
          block
          variant="primary"
          disabled={
            !objectType ||
            !objectOperations ||
            state.prep !== statusType.pending
          }
          onClick={onClick}
          Icon={<FiUpload className="text-xl" />}
        >
          Import
        </Button>
        <Button
          variant="link"
          href={
            "data:text/plain;charset=utf-8," +
            encodeURIComponent(exampleCSV as string)
          }
          downloadName={`${objectTypeDisplayName
            .split(" ")
            .join("_")}_example.csv`}
          disabled={
            !exampleCSV ||
            !objectType ||
            !objectOperations ||
            state.prep !== statusType.pending
          }
          Icon={<FiDownload className="text-xl" />}
        >
          Download Example CSV
        </Button>
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
        <Dromo
          show={showDromo}
          accountIdentifier={createAccountIdentifier(creds.uri)}
          objectMeta={objectOperations}
          allObjectsMeta={allObjectsMeta}
          objectTypesWithConfig={objectTypesWithConfig}
          onResults={onResults}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}
