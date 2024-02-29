import DromoUploader from "dromo-uploader-react";
import { useState, useReducer, useEffect } from "react";
import { FiDownload, FiUpload } from "react-icons/fi";

import { Button } from "src/components/button";
import { ObjectTypeSelect } from "src/components/inputs/select";
import { StatusCard, statusType } from "src/components/statusCard";
import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";
import { useListAllObjects } from "src/hooks/objects/list/useListAllObjects";
import {
  useSkylarkObjectOperations,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  NormalizedObjectField,
  ParsedSkylarkObjectConfig,
} from "src/interfaces/skylark";
import {
  DromoSchema,
  convertObjectInputToDromoSchemaFields,
  convertRelationshipsToDromoSchemaFields,
} from "src/lib/dromo/schema";
import { generateExampleCSV } from "src/lib/flatfile";
import { convertObjectInputToFlatfileSchema } from "src/lib/flatfile/template";
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

export default function CSVImportPage() {
  const [{ objectType, config: objectTypeConfig }, setObjectTypeWithConfig] =
    useState<{ objectType: string; config?: ParsedSkylarkObjectConfig }>({
      objectType: "",
    });

  const objectTypeDisplayName =
    objectTypeConfig?.objectTypeDisplayName || objectType;

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { data: allObjects } = useListAllObjects();

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const [state, dispatch] = useReducer(reducer, initialState);

  const [
    { numCreated, numErrored, totalImportedToFlatfile },
    setObjectAmounts,
  ] = useState({
    totalImportedToFlatfile: 0,
    numCreated: 0,
    numErrored: 0,
  });

  const [creds] = useSkylarkCreds();

  const [dromoSchema, setDromoSchema] = useState<DromoSchema | null>(null);

  const relationshipFields: DromoSchema["fields"] =
    objectOperations?.relationships
      ? convertRelationshipsToDromoSchemaFields(
          objectOperations.relationships,
          allObjects || {},
          objectTypesWithConfig || [],
        )
      : [];

  console.log({ relationshipFields });

  const onClick = async () => {
    if (!objectOperations) {
      return;
    }

    dispatch({ stage: "prep", status: statusType.inProgress });
    const fields = convertObjectInputToDromoSchemaFields(
      objectOperations.operations.create.inputs,
      objectOperations.relationships,
    );

    if (!creds) {
      dispatch({ stage: "prep", status: statusType.error });
      throw new Error(
        "Skylark GraphQL URI or Access Key not found in local storage",
      );
    }

    const accountIdentifier = createAccountIdentifier(creds.uri);
    // const template = await createFlatfileTemplate(
    //   objectType,
    //   schema,
    //   accountIdentifier,
    // );

    const settings: DromoSchema["settings"] = {
      importIdentifier: `${accountIdentifier}-${objectOperations.name}`,
      title: objectOperations.name,
    };

    dispatch({ stage: "prep", status: statusType.success });
    await pause(500); // Reflect state on client side, then open
    // await openFlatfileImportClient(
    //   template.embedId,
    //   template.token,
    //   createObjectsInSkylark,
    // );
    setDromoSchema({ fields, settings });

    dispatch({ stage: "import", status: statusType.inProgress });
  };

  const closeFlatfile = () => dispatch({ stage: "reset" });

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
      <DromoUploader
        open={!!dromoSchema}
        onCancel={() => setDromoSchema(null)}
        onResults={(d) => {
          console.log("submitted", d);
          setDromoSchema(null);
        }}
        developmentMode
        licenseKey={"bace02ef-7319-4911-a3ce-5a3cc3d79df9"}
        user={{ id: "jw" }}
        fields={[...(dromoSchema?.fields || []), ...relationshipFields]}
        settings={dromoSchema?.settings}
      />
    </div>
  );
}
