import { isSkylarkObjectType } from "src/lib/utils";

interface ContentModelEditorHeaderProps {
  objectType: string;
}

export const ContentModelEditorHeader = ({
  objectType,
}: ContentModelEditorHeaderProps) => {
  return (
    <div className="flex flex-col items-start">
      <h3 className="text-2xl font-semibold">{objectType}</h3>
      <p className="text-sm text-manatee-400">
        {isSkylarkObjectType(objectType) ? "System Object" : "Custom Object"}
      </p>
    </div>
  );
};
