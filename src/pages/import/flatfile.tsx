import { useState } from "react";

import { Button } from "src/components/button";
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

  return (
    // <div className="flex h-full flex-col items-center justify-center gap-10 ">
    //   <div className="flex w-64 flex-col gap-4">
    //     <select
    //       id="type"
    //       className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
    //       onChange={(e) => setObjectType(e.target.value)}
    //     >
    //       <option value="" defaultChecked>{`Select Skylark object`}</option>
    //       {objectTypes?.sort().map((objectType) => (
    //         <option key={objectType} value={objectType}>
    //           {objectType}
    //         </option>
    //       ))}
    //     </select>

    //     <Button
    //       block
    //       variant="primary"
    //       disabled={!objectType || !object}
    //       onClick={onClick}
    //     >
    //       Import
    //     </Button>
    //   </div>
    // </div>

    // Rui pop it here
    <></>
  );
}
