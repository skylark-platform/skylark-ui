import { CompareSchemaVersions } from "src/components/contentModel/compareSchemasVersions/compareSchemaVersions.component";

export default function CompareSchemas() {
  return (
    <div className="mx-auto mt-32 flex w-full max-w-5xl flex-col justify-center text-sm">
      <h1 className="mb-8 text-center font-heading text-4xl">
        Compare Schemas
      </h1>
      <CompareSchemaVersions baseVersionNumber={196} updateVersionNumber={10} />
    </div>
  );
}
