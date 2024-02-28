import { ReactNode } from "react";

export interface CompareSchemaVersionsProps {
  baseVersionNumber: number;
  updateVersionNumber: number;
}

export const DiffSection = ({
  title,
  type,
  count,
  children,
  isEnums,
}: {
  title: string;
  type: "unmodified" | "added" | "removed" | "modified";
  count: number;
  children: ReactNode;
  isEnums?: boolean;
}) => (
  <section>
    <h3 className="text-lg font-medium text-black">
      {title} ({count})
    </h3>
    {children}
    {count === 0 && (
      <p className="mt-2">
        No {isEnums ? "enums" : "object types"} {type}.
      </p>
    )}
  </section>
);
