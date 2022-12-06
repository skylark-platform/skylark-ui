import { useState, useReducer } from "react";

import { Button } from "src/components/button";
import { Select } from "src/components/select/select.component";
import {
  StatusCard,
  Props as StatusCardProps,
  statusType,
} from "src/components/statusCard";
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
    success: {
      title: "Select object type",
      description: "Choose the Skylark object type to import",
    },
    pending: {
      title: "sdfs",
      description: "sdfs",
    },
    error: {
      title: "sdfs",
      description: "sdfs",
    },
  },
  prep: {
    success: {
      title: "Preparing import",
      description: "Updating your template to match your Skylark schema",
    },
    pending: {
      title: "sdfs",
      description: "sdfs",
    },
  },
  import: {
    success: {
      title: "Import Data",
      description: "Map your CSV to your Skylark schema",
    },
    pending: {
      title: "sdfs",
      description: "sdfs",
    },
    error: {
      title: "sdfs",
      description: "sdfs",
    },
  },
  create: {
    success: {
      title: "Create in Skylark",
      description: "Your imported data will be created",
    },
    pending: {
      title: "sdfs",
      description: "sdfs",
    },
  },
};

const initialState: { [key: string]: statusType } = {
  select: statusType.pending,
  import: statusType.pending,
  prep: statusType.pending,
  create: statusType.pending,
};

function reducer(
  state: {
    select: statusType;
    prep: statusType;
    import: statusType;
    create: statusType;
  },
  action: { stage: string; status: statusType },
) {
  switch (action.stage) {
    case "select":
      return {
        ...state,
        select: action.status,
      };

    default:
      return state;
  }
}

export default function Import() {
  const { objectTypes } = useSkylarkObjectTypes();
  const [objectType, setObjectType] = useState("");
  const { object } = useSkylarkObjectOperations(objectType);

  const [state, dispatch] = useReducer(reducer, initialState);

  const createObjectsInSkylark = async (batchId: string) => {
    await importFlatfileDataToSkylark(objectType, batchId);
  };

  const onClick = async () => {
    const schema = convertObjectInputToFlatfileSchema(
      object?.operations.create.inputs as NormalizedObjectField[],
    );
    const template = await createFlatfileTemplate(objectType, schema);

    await openFlatfileImportClient(
      template.embedId,
      template.token,
      createObjectsInSkylark,
    );
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
          console.log("1", card);
          console.log("2", copyText[card]);
          console.log("3", state[card]);
          console.log("4", copyText[card][state[card]]);
          return (
            <StatusCard
              key={i}
              title={copyText[card][state[card]].title}
              description={copyText[card][status].description}
              status={status}
            />
          );
        })}
      </section>
    </div>
  );
}
