import { useState } from "react";

import { Button } from "src/components/button";
import { Select } from "src/components/select/select.component";
import { useListObjects } from "src/hooks/useListObjects";
import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";

export default function Home() {
  const { objectTypes } = useSkylarkObjectTypes();
  const [objectType, setObjectType] = useState("");

  const { data } = useListObjects(objectType);

  const ignoredKeys = ["__typename"];
  const orderedKeys = ["__typename", "title", "name"];
  const objectProperties = data
    ? Object.keys(data?.objects[0]).filter((key) => !ignoredKeys.includes(key))
    : [];

  // Sorts objects using the preference array above, any others are added to the end randomly
  const sortedProperties = objectProperties.sort((a: string, b: string) => {
    if (orderedKeys.indexOf(a) === -1) {
      return 1;
    }
    if (orderedKeys.indexOf(b) === -1) {
      return -1;
    }
    return orderedKeys.indexOf(a) - orderedKeys.indexOf(b);
  });

  return (
    <div className="px-16 pt-28">
      <div className="flex w-full flex-row items-center justify-between gap-4">
        <Select
          className="w-64"
          placeholder="Select Skylark object"
          options={
            objectTypes?.sort().map((objectType) => ({
              label: objectType,
              value: objectType,
            })) || []
          }
          onChange={(value) => setObjectType(value as string)}
        />
        <div className="flex flex-row gap-4">
          <Button variant="primary">Create</Button>
          <Button variant="outline" href="/import/csv">
            Import
          </Button>
        </div>
      </div>

      {data && (
        <div className="mt-16 overflow-x-auto">
          <table className="table-compact table">
            <thead>
              <tr>
                {sortedProperties?.map((property) => (
                  <th key={property}>{property}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.objects.map((object) => (
                <tr key={`row-${object.uid}`}>
                  {sortedProperties?.map((property) => (
                    <td key={`${object.uid}-${property}`}>
                      {object[property]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
