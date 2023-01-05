import { ObjectList } from "src/components/objectListing";

export default function Home() {
  return (
    <div className="px-4 pt-20 md:px-16 md:pt-28">
      <ObjectList withCreateButtons />
    </div>
  );
}
