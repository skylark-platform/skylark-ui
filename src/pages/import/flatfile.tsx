import { useState } from "react";

import { Button } from "src/components/button";
import { Select } from "src/components/select/select.component";
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

export default function Import() {
  const { objectTypes } = useSkylarkObjectTypes();
  const [objectType, setObjectType] = useState("");
  const { object } = useSkylarkObjectOperations(objectType);

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
          onChange={(value) => setObjectType(value as string)}
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
      <section className="flex flex-grow flex-col items-center justify-center bg-gray-200"></section>
    </div>
  );
}
