import { useState, useReducer, useEffect } from "react";

import { Button } from "src/components/button";
import { Select } from "src/components/select/select.component";
import { StatusCard, statusType } from "src/components/statusCard";
import { LOCAL_STORAGE } from "src/constants/skylark";
import {
  useSkylarkObjectOperations,
  useSkylarkObjectTypes,
} from "src/hooks/useSkylarkObjectTypes";
import { ApiRouteTemplateData } from "src/interfaces/apiRoutes";
import { FlatfileTemplate } from "src/interfaces/flatfile/template";
import {
  NormalizedObjectField,
  SkylarkObjectType,
} from "src/interfaces/skylark/objects";
import { openFlatfileImportClient } from "src/lib/flatfile";
import { convertObjectInputToFlatfileSchema } from "src/lib/flatfile/template";
import { pause } from "src/lib/utils";

type ImportStates = "select" | "prep" | "import" | "create";

const orderedStates = ["select", "prep", "import", "create"] as ImportStates[];

const createFlatfileTemplate = async (
  name: string,
  template: FlatfileTemplate,
) => {
  const res = await fetch("/api/flatfile/template", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      name,
      template,
    }),
  });

  const data = (await res.json()) as ApiRouteTemplateData;

  return data;
};

const importFlatfileDataToSkylark = async (
  objectType: SkylarkObjectType,
  batchId: string,
  graphQLUri: string,
  graphQLToken: string,
) => {
  const res = await fetch("/api/flatfile/import", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      objectType,
      batchId,
      graphQLUri,
      graphQLToken,
    }),
  });

  const data = (await res.json()) as ApiRouteTemplateData;

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
      inProgress: "Your {objectType}s are being created in Skylark",
      success:
        "Your {objectType}s have been successfully imported into Skylark",
      error: "Error while creating {objectType}s",
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
  const { object } = useSkylarkObjectOperations(objectType);

  const [state, dispatch] = useReducer(reducer, initialState);

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

    await importFlatfileDataToSkylark(
      objectType,
      batchId,
      graphQLUri,
      graphQLToken,
    );
    dispatch({ stage: "create", status: statusType.success });
  };

  const onClick = async () => {
    dispatch({ stage: "prep", status: statusType.inProgress });
    const schema = convertObjectInputToFlatfileSchema(
      object?.operations.create.inputs as NormalizedObjectField[],
    );
    const template = await createFlatfileTemplate(objectType, schema);

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

  return (
    <div className="flex h-full w-full flex-col sm:flex-row">
      <section className="flex w-full flex-col gap-6 p-10 pt-24 sm:w-1/2 sm:gap-10 md:px-20 md:pt-48 lg:w-1/2 xl:w-2/5 xl:px-24 2xl:w-1/3 2xl:px-28">
        <h2 className="font-heading text-2xl font-bold md:text-3xl">
          Import from CSV
        </h2>
        <Select
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
          disabled={!objectType || !object || state.prep !== statusType.pending}
          onClick={onClick}
        >
          Import
        </Button>
      </section>
      <section className="flex flex-grow flex-col items-center justify-center bg-gray-200 py-10">
        <div className="flex w-5/6 flex-col items-center justify-center gap-4 md:gap-6 lg:w-3/5 xl:w-1/2 2xl:w-1/3">
          {orderedStates.map((card) => {
            const copyCard = copyText[card];
            const status = state[card];

            return (
              <StatusCard
                key={copyCard.title}
                title={copyCard.title}
                description={copyCard.messages[status].replace(
                  "{objectType}",
                  objectType,
                )}
                status={status}
              />
            );
          })}
          <div className="flex w-full flex-row justify-end gap-x-4">
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
              disabled={state.create !== statusType.success}
            >
              New import
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
