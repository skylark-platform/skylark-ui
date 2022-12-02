import { useSkylarkObjectTypes } from "src/hooks/useSkylarkObjectTypes";
import { useSkylarkSchema } from "src/hooks/useSkylarkSchema";

export default function Home() {
  const { error, objectTypes } = useSkylarkObjectTypes();

  const { data: schema } = useSkylarkSchema();
  console.log(schema);

  return (
    <div className="flex w-full flex-col items-center justify-center p-10 pt-32 text-black">
      {error && <p>{error.message}</p>}
      {objectTypes && objectTypes.map((type) => <p key={type}>{type}</p>)}
    </div>
  );
}
