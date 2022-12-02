import { useState, useReducer } from "react";

import { Button } from "src/components/button";
import { DropDown } from "src/components/select";
import {
  StatusCard,
  Props as StatusCardProps,
} from "src/components/statusCard";
import { useSkylarkSchema } from "src/hooks/useSkylarkSchema";
import { ApiRouteTemplateData } from "src/interfaces/apiRoutes";
import { FlatfileTemplate } from "src/interfaces/flatfile/template";
import { openFlatfileImportClient } from "src/lib/flatfile";

const schema: FlatfileTemplate = {
  type: "object",
  required: [],
  unique: [],
  properties: {
    test: {
      type: "string",
      label: "Test",
    },
  },
};

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

const importFlatfileDataToSkylark = async (batchId: string) => {
  const res = await fetch("/api/flatfile/import", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      batchId,
    }),
  });

  const data = (await res.json()) as ApiRouteTemplateData;

  return data;
};

const createObjectsInSkylark = async (batchId: string) => {
  await importFlatfileDataToSkylark(batchId);
};

const startImporter = async () => {
  const template = await createFlatfileTemplate("Episode", schema);

  await openFlatfileImportClient(
    template.embedId,
    template.token,
    createObjectsInSkylark,
  );
};

const initialState = {
  select: {
    title: "Select object type",
    description: "Choose the Skylark object type to import",
    status: "stale",
  },
  prep: {
    title: "Preparing import",
    description: "Updating your template to match your Skylark schema",
    status: "stale",
  },
  import: {
    title: "Import Data",
    description: "Map your CSV to your Skylark schema",
    status: "stale",
  },
  create: {
    title: "Create in Skylark",
    description: "Your imported data will be created",
    status: "stale",
  },
};

function reducer(
  state: {
    select: StatusCardProps;
    prep: StatusCardProps;
    import: StatusCardProps;
    create: StatusCardProps;
  },
  action: { type: string },
) {
  switch (action.type) {
    case "select":
      startImporter();
      return {
        ...state,
        select: {
          title: "Importing TODO",
          description: "You have selected {TODO}",
          status: "completed",
        },
      };

    default:
      return state;
  }
}

/*
const text = {
  select: {
    success: {
      title: "sdfs",
      description: "sdfs",
    },
    error: {
      title: "sdfs",
      description: "sdfs",
    }
  },
  import: {
    success: {
      title: "sdfs",
      description: "sdfs",
    },
    error: {
      title: "sdfs",
      description: "sdfs",
    }
  }
}

text[stage][status]
*/

export default function Import() {
  const res = useSkylarkSchema();
  console.log("Skylark: ", res);

  const [state, dispatch] = useReducer(reducer, initialState);

  const options = []; // res?.data?.map(({ objectType }) => objectType).sort();

  const [event, setEvent] = useState<
    | "creatingTemplate"
    | "runningFlatfile"
    | "creatingObjects"
    | "completed"
    | null
  >(null);

  const onClick = async () => {
    setEvent("creatingTemplate");
    const template = await createFlatfileTemplate("Episode", schema);

    setEvent("runningFlatfile");
    await openFlatfileImportClient(
      template.embedId,
      template.token,
      createObjectsInSkylark,
    );
  };

  return (
    <div className="flex h-full flex-row md:mt-14">
      <section className="w-2/5 flex-col p-20">
        <h2 className="text-2xl font-bold">Import from CSV</h2>
        <div className="mt-6">
          <p className="text-sm font-light"></p>
          <DropDown label="Select your Skylark object type" options={options} />

          <Button
            className="mt-6"
            variant="primary"
            block
            onClick={() => dispatch({ type: "select" })}
          >
            Import
          </Button>
        </div>
      </section>
      <section className="flex w-3/5 flex-col items-center justify-center bg-gray-200">
        {Object.values(state).map((card, i) => (
          <StatusCard key={i} {...card} />
        ))}
      </section>
    </div>
  );

  return (
    <div className="flex flex-col p-20 md:mt-14">
      <div className="flex-flex-row">
        <Button title="Create" />
      </div>
      <div className="">
        <table>
          <thead>
            <tr>
              <th>Object type</th>
              <th>Name</th>
              <th>Date added</th>
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10">
      <button
        className="rounded bg-brand-primary p-2 px-4 text-white"
        onClick={onClick}
      >
        Import Episode
      </button>

      {event && event !== "completed" && (
        <div className="flex flex-col items-center justify-center gap-4">
          {event === "creatingTemplate" && <p>Creating Flatfile Template</p>}
          {event === "runningFlatfile" && <p>Running Flatfile Importer</p>}
          {event === "creatingObjects" && <p>Creating Objects in Skylark</p>}
          <svg
            className="mr-2 inline h-10 w-10 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
        </div>
      )}
      {event === "completed" && (
        <div className="flex flex-col items-center justify-center gap-4">
          <p>Data successfully imported</p>
        </div>
      )}
    </div>
  );
}
