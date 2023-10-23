import dynamic from "next/dynamic";
import { FiDownload, FiArrowUp } from "react-icons/fi";

import { Button } from "src/components/button";
import { Spinner } from "src/components/icons";
import { useGenerateDataModelFromSkylarkSchema } from "src/hooks/useSkylarkSchemaIntrospectionAsDataModelJSON";

const DynamicSyntaxHighlighter = dynamic(
  () =>
    import(
      "../../components/modals/graphQLQueryModal/lightweightSyntaxHighlighter.component"
    ),
  {
    loading: () => (
      <div className="flex w-full justify-center">
        <Spinner className="mt-10 h-10 w-10 animate-spin" />
      </div>
    ),
  },
);

export default function DataModel() {
  const { dataModel } = useGenerateDataModelFromSkylarkSchema();

  const stringifiedDataModel = JSON.stringify(dataModel || {}, null, 2);

  return (
    <div className="mx-auto mt-32 flex w-full max-w-5xl flex-col justify-center text-sm">
      <h1 className="mb-8 text-center font-heading text-4xl">Data Model</h1>
      <div className="mx-20">
        <p className="mb-1 mt-2">Missing support for:</p>
        <ul className="mb-4 ml-8 list-disc">
          <li>
            Default relationship sort fields (Current implementation takes a
            best guessed approach using previously known sort fields)
          </li>
          <li>Handling multiple relationships to the same Object Type</li>
        </ul>
      </div>
      <Button
        variant="link"
        href={
          "data:text/plain;charset=utf-8," +
          encodeURIComponent(stringifiedDataModel)
        }
        downloadName={`skylark-data-model-${dataModel?.info.name}.json`}
        disabled={!dataModel}
        Icon={<FiDownload className="text-xl" />}
      >
        Download
      </Button>
      <div className="mt-4 pb-10 shadow">
        <DynamicSyntaxHighlighter
          language={"json"}
          value={JSON.stringify(dataModel || {}, null, 4)}
        />
      </div>
      <div className="fixed bottom-20 right-20 flex items-center justify-center rounded">
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          variant="primary"
          Icon={<FiArrowUp className="text-xl" />}
        />
      </div>
    </div>
  );
}
