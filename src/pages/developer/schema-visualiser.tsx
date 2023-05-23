import dynamic from "next/dynamic";

import { Spinner } from "src/components/icons";
import { useSkylarkSchemaIntrospection } from "src/hooks/useSkylarkSchemaIntrospection";

const DynamicVoyager = dynamic(
  () =>
    import("../../components/graphqlVoyager/graphqlVoyager.component").then(
      (mod) => mod.GraphQLVoyager,
    ),
  {
    loading: () => (
      <div className="flex w-full justify-center">
        <Spinner className="mt-20 h-10 w-10 animate-spin" />
      </div>
    ),
    ssr: false,
  },
);

export default function SchemaVisualiser() {
  const { data, isLoading } = useSkylarkSchemaIntrospection();

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {data && <DynamicVoyager />}
    </div>
  );
}
