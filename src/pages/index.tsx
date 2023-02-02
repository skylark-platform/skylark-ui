import { ObjectList } from "src/components/objectListing";

export default function Home() {
  return (
    <div className="px-2 pt-18 sm:px-4 md:px-6 md:pt-28 lg:px-10">
      <ObjectList withCreateButtons />
    </div>
  );
}
