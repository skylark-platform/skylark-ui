import { useState } from "react";
import { FiCheckSquare, FiXSquare, FiEdit } from "react-icons/fi";

import { Button } from "src/components/button";
import { ColourPicker } from "src/components/inputs/colourPicker";
import { TextInput } from "src/components/inputs/textInput";
import { isSkylarkObjectType } from "src/lib/utils";

interface ContentModelEditorHeaderProps {
  objectType: string;
}

const ObjectTypeUIDisplayNameInput = ({
  className,
  name,
  onRename,
}: {
  className?: string;
  name: string;
  onRename: (name: string) => void;
}) => {
  const [updatedName, setUpdatedName] = useState<string | null>(null);

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        {updatedName !== null ? (
          <>
            <TextInput
              onChange={setUpdatedName}
              value={updatedName}
              className="w-full text-sm md:w-80 md:text-base lg:w-96"
              aria-label="tab name input"
              onEnterKeyPress={() => {
                if (updatedName.length > 0) {
                  onRename(updatedName);
                  setUpdatedName(null);
                }
              }}
            />
            <Button
              variant="ghost"
              className="text-success"
              aria-label="save tab rename"
              disabled={updatedName.length === 0}
              onClick={() => {
                onRename(updatedName);
                setUpdatedName(null);
              }}
            >
              <FiCheckSquare className="text-lg" />
            </Button>
            <Button
              variant="ghost"
              className="text-error"
              aria-label="cancel tab rename"
              onClick={() => {
                setUpdatedName(null);
              }}
            >
              <FiXSquare className="text-lg" />
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold">{name}</h2>
            <Button
              variant="ghost"
              className="text-manatee-400 hover:text-black"
              onClick={() => {
                setUpdatedName(name || "");
              }}
              aria-label="Rename object type UI name"
            >
              <FiEdit className="text-lg" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export const ContentModelEditorHeader = ({
  objectType,
}: ContentModelEditorHeaderProps) => {
  return (
    <div className="flex flex-col items-start">
      <h3 className="text-2xl font-semibold">{objectType}</h3>
      {isSkylarkObjectType(objectType) && (
        <p className="text-sm text-manatee-400">(System Object)</p>
      )}

      {/* <ColourPicker
          colour={colour || ""}
          onChange={(colour) => form.setValue("colour", colour)}
        /> */}
      {/* <ObjectTypeUIDisplayNameInput
          onRename={(name) => form.setValue("objectTypeDisplayName", name)}
          name={objectTypeDisplayName}
        /> */}
      {/* <div className="flex space-x-2 font-normal text-sm text-manatee-300">
        <p>{objectType}</p>
        {isSkylarkObjectType(objectType) && <p>(System Object)</p>}
      </div> */}
    </div>
  );
};
