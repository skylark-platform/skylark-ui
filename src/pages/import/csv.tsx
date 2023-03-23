import { useState, useReducer, useEffect } from "react";

import { Button } from "src/components/button";
import { Select } from "src/components/select";
import { StatusCard, statusType } from "src/components/statusCard";
import { LOCAL_STORAGE } from "src/constants/skylark";
import {
  useSkylarkObjectOperations,
  useSkylarkObjectTypes,
} from "src/hooks/useSkylarkObjectTypes";
import {
  ApiRouteFlatfileImportRequestBody,
  ApiRouteFlatfileImportResponse,
  ApiRouteTemplateData,
} from "src/interfaces/apiRoutes";
import { FlatfileRow } from "src/interfaces/flatfile/responses";
import { FlatfileTemplate } from "src/interfaces/flatfile/template";
import { NormalizedObjectField } from "src/interfaces/skylark";
import {
  createFlatfileObjectsInSkylark,
  generateExampleCSV,
  openFlatfileImportClient,
} from "src/lib/flatfile";
import { convertObjectInputToFlatfileSchema } from "src/lib/flatfile/template";
import { createSkylarkClient } from "src/lib/graphql/skylark/client";
import { createAccountIdentifier, pause } from "src/lib/utils";

type ImportStates = "select" | "prep" | "import" | "create";

const orderedStates = ["select", "prep", "import", "create"] as ImportStates[];

const createFlatfileTemplate = async (
  name: string,
  template: FlatfileTemplate,
  accountIdentifier: string,
) => {
  const res = await fetch("/api/flatfile/template", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      name,
      template,
      accountIdentifier,
    }),
  });

  const data = (await res.json()) as ApiRouteTemplateData;

  return data;
};

const getImportedFlatfileData = async (
  batchId: string,
  limit: number,
  offset: number,
) => {
  const body: ApiRouteFlatfileImportRequestBody = {
    batchId,
    offset,
    limit,
  };
  const res = await fetch("/api/flatfile/import", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as ApiRouteFlatfileImportResponse;

  return data;
};

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
  const { objectTypes } = useSkylarkObjectTypes();
  const [objectType, setObjectType] = useState("");
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const [state, dispatch] = useReducer(reducer, initialState);
  const [
    { numCreated, numErrored, totalImportedToFlatfile },
    setObjectAmounts,
  ] = useState({
    totalImportedToFlatfile: 0,
    numCreated: 0,
    numErrored: 0,
  });

  const createObjectsInSkylark = async (batchId: string) => {
    dispatch({ stage: "import", status: statusType.success });
    dispatch({ stage: "create", status: statusType.inProgress });
    const graphQLUri = localStorage.getItem(LOCAL_STORAGE.betaAuth.uri);
    const graphQLToken = localStorage.getItem(LOCAL_STORAGE.betaAuth.token);
    if (!graphQLUri || !graphQLToken) {
      dispatch({ stage: "create", status: statusType.error });
      throw new Error(
        "Skylark GraphQL URI or Access Key not found in local storage",
      );
    }

    let numObjectsToCreate = 0;
    try {
      const flatfileRequestLimit = 1000;
      const acceptedData: FlatfileRow[] = [];

      const { rows: intialRows, totalRows } = await getImportedFlatfileData(
        batchId,
        flatfileRequestLimit,
        0,
      );

      acceptedData.push(...intialRows);
      numObjectsToCreate = totalRows;

      if (totalRows > intialRows.length) {
        // Floor because of the initial request
        const requestsToMake = Math.floor(totalRows / flatfileRequestLimit);
        const additionalRequests = await Promise.all(
          Array.from({ length: requestsToMake }, (_, i) => ({
            offset: (i + 1) * flatfileRequestLimit,
          })).map(({ offset }) =>
            getImportedFlatfileData(batchId, flatfileRequestLimit, offset),
          ),
        );

        const flattenedAdditionalRows = additionalRequests.flatMap(
          ({ rows }) => rows,
        );
        acceptedData.push(...flattenedAdditionalRows);
      }

      const skylarkClient = createSkylarkClient(graphQLUri, graphQLToken);

      const skylarkObjects = await createFlatfileObjectsInSkylark(
        skylarkClient,
        objectType,
        batchId,
        acceptedData,
      );

      setObjectAmounts({
        totalImportedToFlatfile: numObjectsToCreate,
        numCreated: skylarkObjects.data.length,
        numErrored: skylarkObjects.errors.length,
      });
      if (skylarkObjects.errors.length > 0) {
        console.error("Errors creating objects:", skylarkObjects.errors);
        dispatch({ stage: "create", status: statusType.error });
      } else {
        dispatch({ stage: "create", status: statusType.success });
      }
    } catch (err) {
      console.error(err);
      setObjectAmounts({
        totalImportedToFlatfile: numObjectsToCreate,
        numCreated: 0,
        numErrored: numObjectsToCreate,
      });
      dispatch({ stage: "create", status: statusType.error });
    }
  };

  const onClick = async () => {
    dispatch({ stage: "prep", status: statusType.inProgress });
    const schema = convertObjectInputToFlatfileSchema(
      objectOperations?.operations.create.inputs as NormalizedObjectField[],
    );

    const graphQLUri = localStorage.getItem(LOCAL_STORAGE.betaAuth.uri);
    if (!graphQLUri) {
      dispatch({ stage: "prep", status: statusType.error });
      throw new Error(
        "Skylark GraphQL URI or Access Key not found in local storage",
      );
    }

    const accountIdentifier = createAccountIdentifier(graphQLUri);
    const template = await createFlatfileTemplate(
      objectType,
      schema,
      accountIdentifier,
    );

    dispatch({ stage: "prep", status: statusType.success });
    await pause(500); // Reflect state on client side, then open
    await openFlatfileImportClient(
      template.embedId,
      template.token,
      createObjectsInSkylark,
    );
    dispatch({ stage: "import", status: statusType.inProgress });
  };

  const closeFlatfile = () => dispatch({ stage: "reset" });

  useEffect(() => {
    if (state.import === statusType.inProgress) {
      document
        .getElementsByClassName("flatfile-close")[0]
        ?.addEventListener("click", closeFlatfile);
    }
    return () => {
      document
        .getElementsByClassName("flatfile-close")[0]
        ?.removeEventListener("click", closeFlatfile);
    };
  }, [state.import]);

  const objectTypeOptions =
    objectTypes
      ?.sort()
      .map((objectType) => ({ label: objectType, value: objectType })) || [];

  const exampleCSV = generateExampleCSV(objectOperations);

  return (
    <div className="flex h-full w-full flex-col sm:flex-row">
      <section className="flex w-full flex-col space-y-3 p-10 pb-6 pt-24 sm:w-1/2 sm:space-y-5 md:px-20 md:pt-48 lg:w-1/2 xl:w-2/5 xl:px-24 2xl:w-1/3 2xl:px-28">
        <h2 className="font-heading text-2xl font-bold md:text-3xl">
          Import from CSV
        </h2>
        <Select
          variant="primary"
          options={objectTypeOptions}
          placeholder="Select Skylark object"
          label="Select your Skylark object type"
          onChange={(value) => {
            setObjectType(value as string);
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
        >
          Import
        </Button>
        <Button
          variant="link"
          href={
            "data:text/plain;charset=utf-8," +
            encodeURIComponent(exampleCSV as string)
          }
          downloadName={`${objectType}_example.csv`}
          disabled={
            !exampleCSV ||
            !objectType ||
            !objectOperations ||
            state.prep !== statusType.pending
          }
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
                  .replace("{objectType}", objectType)
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
              href={`/?objectType=${objectType}`}
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
    </div>
  );
}
