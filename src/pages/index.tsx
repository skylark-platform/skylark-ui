import { ContentLibrary } from "src/components/contentLibrary";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";

export default function Home() {
  const { dimensions } = useAvailabilityDimensionsWithValues();
  console.log({ dimensions });
  return (
    <div className=" pt-nav">
      <ContentLibrary />
    </div>
  );
}
