import { ObjectList } from "src/components/objectListing";

export default function Home() {
  return (
    <div className="px-16 pt-28">
      <ObjectList withCreateButtons />
    </div>
  );
}
