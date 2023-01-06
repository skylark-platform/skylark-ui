import { ObjectList } from "src/components/objectListing";

export default function Home() {
  return (
    <div className="px-4 pt-20 md:px-10 md:pt-24 ">
      <h1 className="mb-1 font-heading text-4xl">Create Relationships</h1>
      <p className="font-body mb-4">
        Select an object on the left and create a new relationship to it.
      </p>
      <div className="flex w-full shadow [&>div]:border [&>div]:border-manatee-50 [&>div]:p-4">
        <div className="w-1/3">
          <ObjectList />
        </div>
        <div className="w-1/3">
          <ObjectList />
        </div>
        <div className="w-1/3">
          <h2>Relationships</h2>
        </div>
      </div>
    </div>
  );
}
