import { useState, useReducer } from "react";

import { Button } from "src/components/button";
import { Select } from "src/components/select/select.component";
import { StatusCard, statusType } from "src/components/statusCard";
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
) => {
  const res = await fetch("/api/flatfile/import", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      objectType,
      batchId,
    }),
  });

  const data = (await res.json()) as ApiRouteTemplateData;

  return data;
};

const copyText: {
  [key: string]: { [key: string]: { title: string; description: string } };
} = {
  select: {
    pending: {
      title: "Select object type",
      description: "Choose the Skylark object type to import",
    },
    success: {
      title: "Importing {objectType}",
      description: "You have selected {objectType}",
    },
  },
  prep: {
    pending: {
      title: "Preparing import",
      description: "Updating your template to match your Skylark schema",
    },
    inProgress: {
      title: "Preparing import",
      description: "Updating your template to match your Skylark schema",
    },
    success: {
      title: "Preparation complete",
      description: "Your import templatehas been updated",
    },
    error: {
      title: "Error",
      description: "-",
    },
  },
  import: {
    pending: {
      title: "Import Data",
      description: "Map your CSV to your Skylark schema",
    },
    inProgress: {
      title: "Importing Data",
      description: "Opening CSV importer",
    },
    success: {
      title: "Import complete",
      description: "CSV imported successfully",
    },
    error: {
      title: "Error",
      description: "-",
    },
  },
  create: {
    pending: {
      title: "Create in Skylark",
      description: "Your imported data will be created",
    },
    inProgress: {
      title: "Creating Skylark {objectType}s",
      description: "Your {objectType}s are being created in Skylark",
    },
    success: {
      title: "All {objectType} created",
      description: "CSV data created in Skylark",
    },
    error: {
      title: "Error",
      description: "-",
    },
  },
};

const initialState: { [key: string]: statusType } = {
  select: statusType.pending,
  prep: statusType.pending,
  import: statusType.pending,
  create: statusType.pending,
};

function reducer(
  state: { [key: string]: statusType },
  action: { stage: string; status: statusType },
) {
  return {
    ...state,
    [action.stage]: action.status,
  };
}

export default function Import() {
  const { objectTypes } = useSkylarkObjectTypes();
  const [objectType, setObjectType] = useState("");
  const { object } = useSkylarkObjectOperations(objectType);

  const [state, dispatch] = useReducer(reducer, initialState);

  const createObjectsInSkylark = async (batchId: string) => {
    dispatch({ stage: "create", status: statusType.inProgress });
    await importFlatfileDataToSkylark(objectType, batchId);
    dispatch({ stage: "create", status: statusType.success });
  };

  const onClick = async () => {
    dispatch({ stage: "prep", status: statusType.inProgress });
    const schema = convertObjectInputToFlatfileSchema(
      object?.operations.create.inputs as NormalizedObjectField[],
    );
    const template = await createFlatfileTemplate(objectType, schema);

    dispatch({ stage: "prep", status: statusType.success });
    dispatch({ stage: "import", status: statusType.inProgress });
    await openFlatfileImportClient(
      template.embedId,
      template.token,
      createObjectsInSkylark,
    );
    dispatch({ stage: "import", status: statusType.success });
  };

  const objectTypeOptions =
    objectTypes
      ?.sort()
      .map((objectType) => ({ label: objectType, value: objectType })) || [];

  return (
    <div className="flex h-full w-full flex-row">
      <section className="flex flex-col gap-10 p-20 pt-48 lg:w-1/2 xl:w-2/5 2xl:w-1/3">
        <h2 className="text-2xl font-bold">Import from CSV</h2>
        <Select
          options={objectTypeOptions}
          placeholder="Select Skylark object"
          label="Select your Skylark object type"
          onChange={(value) => {
            setObjectType(value as string);
            dispatch({ stage: "select", status: statusType.success });
          }}
        />
        <Button
          block
          variant="primary"
          disabled={!objectType || !object}
          onClick={onClick}
        >
          Import
        </Button>
      </section>
      <section className="flex flex-grow flex-col items-center justify-center bg-gray-200">
        {Object.keys(state).map((card, i) => {
          const copyCard = copyText[card];
          const status = state[card];

          return (
            <StatusCard
              key={i}
              title={copyCard[status].title.replace("{objectType}", objectType)}
              description={copyCard[status].description.replace(
                "{objectType}",
                objectType,
              )}
              status={status}
            />
          );
        })}
      </section>
    </div>
  );
}
