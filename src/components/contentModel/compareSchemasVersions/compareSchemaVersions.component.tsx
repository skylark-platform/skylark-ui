import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import { compareSkylarkSchemas } from "src/lib/skylark/introspection/schemaComparison";

interface CompareSchemaVersionsProps {
  baseVersionNumber: number;
  updateVersionNumber: number;
}

export const CompareSchemaVersions = ({
  baseVersionNumber,
  updateVersionNumber,
}: CompareSchemaVersionsProps) => {
  const { objects: baseObjectMeta } = useAllObjectsMeta(true, {
    schemaVersion: baseVersionNumber, // Test using: 196
  });

  const { objects: updateObjectMeta } = useAllObjectsMeta(true, {
    schemaVersion: updateVersionNumber, // Test using: 10
  });

  const diff =
    baseObjectMeta && updateObjectMeta
      ? compareSkylarkSchemas(baseObjectMeta, updateObjectMeta)
      : null;

  return (
    <div>
      {/* {diff ? <pre>{JSON.stringify(diff, null, 4)}</pre> : <p>Loading...</p>} */}
      {diff ? (
        <div className="">
          <p className="text-center font-medium mb-2">{`Comparing base version ${baseVersionNumber} to version ${updateVersionNumber}`}</p>
          <p className="text-center mb-10 text-manatee-400">{`Has differences: ${!diff.objectTypes.isEqual}`}</p>
          <h2 className="text-2xl font-medium text-center mb-6">
            Object Types
          </h2>
          <div>
            <h3 className="text-xl my-2">Modified</h3>
            {diff.objectTypes.modified.map(
              ({ objectType, fields, relationships }) => (
                <div key={objectType} className="mb-6">
                  <div className="mb-2">
                    <h4 className="font-medium text-lg mt-4">{objectType}</h4>
                    {!fields.isEqual && (
                      <p className="text-manatee-600 text-xs">{`Field changes detected`}</p>
                    )}
                    {!relationships.isEqual && (
                      <p className="text-manatee-600 text-xs">{`Relationship changes detected`}</p>
                    )}
                  </div>
                  {!fields.isEqual && (
                    <div className="my-2 grid grid-cols-5">
                      <h5 className="font-medium mb-1 col-span-5">Fields</h5>
                      {fields.added.length > 0 && (
                        <>
                          <p className="my-1">{`Added: (${fields.added.length})`}</p>
                          <p className="col-span-4">
                            {fields.added.map(({ name }) => name).join(", ")}
                          </p>
                        </>
                      )}
                      {fields.removed.length > 0 && (
                        <>
                          <p className="my-1">{`Removed: (${fields.removed.length})`}</p>
                          <p className="col-span-4">
                            {fields.removed.map(({ name }) => name).join(", ")}
                          </p>
                        </>
                      )}
                      {fields.unmodified.length > 0 && (
                        <>
                          <p className="my-1">{`Unmodified: (${fields.unmodified.length})`}</p>
                          <p className="col-span-4">
                            {fields.unmodified
                              .map(({ name }) => name)
                              .join(", ")}
                          </p>
                        </>
                      )}
                      {fields.modified.length > 0 && (
                        <>
                          <p className="my-1">{`Modified: (${fields.modified.length})`}</p>
                          <p className="col-span-4">
                            {fields.modified.map(({ name }) => name).join(", ")}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                  {!relationships.isEqual && (
                    <div className="my-2 grid grid-cols-5">
                      <h5 className="font-medium mb-1 col-span-5">
                        Relationships
                      </h5>
                      {relationships.added.length > 0 && (
                        <>
                          <p className="my-1">{`Added (${relationships.added.length})`}</p>
                          <p className="my-1 col-span-4">
                            {relationships.added
                              .map(({ relationshipName }) => relationshipName)
                              .join(", ")}
                          </p>
                        </>
                      )}
                      {relationships.removed.length > 0 && (
                        <>
                          <p className="my-1">{`Removed (${relationships.removed.length})`}</p>
                          <p className="my-1 col-span-4">
                            {relationships.removed
                              .map(({ relationshipName }) => relationshipName)
                              .join(", ")}
                          </p>
                        </>
                      )}
                      {relationships.unmodified.length > 0 && (
                        <>
                          <p className="my-1">{`Unmodified (${relationships.unmodified.length})`}</p>
                          <p className="my-1 col-span-4">
                            {relationships.unmodified
                              .map(({ relationshipName }) => relationshipName)
                              .join(", ")}
                          </p>
                        </>
                      )}
                      {relationships.modified.length > 0 && (
                        <>
                          <p className="my-1">{`Modified (${relationships.modified.length})`}</p>
                          <p className="my-1 col-span-4">
                            {relationships.modified
                              .map(({ name }) => name)
                              .join(", ")}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
          {diff.objectTypes.added.length > 0 && (
            <div>
              <h3 className="text-xl my-2">Added</h3>
              <ul className="ml-4 mb-10 list-disc">
                {diff.objectTypes.added.map((ot) => (
                  <li key={ot}>{ot}</li>
                ))}
              </ul>
            </div>
          )}
          {diff.objectTypes.removed.length > 0 && (
            <div>
              <h3 className="text-xl my-2">Removed</h3>
              <ul className="ml-4 mb-10 list-disc">
                {diff.objectTypes.removed.map((ot) => (
                  <li key={ot}>{ot}</li>
                ))}
              </ul>
            </div>
          )}
          {/* <div>
            <h3 className="text-xl my-2">Unchanged</h3>
            <ul className="ml-4 mb-10 list-disc">
              {diff.objectTypes.unmodified.map((ot) => (
                <li key={ot.objectType}>{ot.objectType}</li>
              ))}
            </ul>
          </div> */}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};
