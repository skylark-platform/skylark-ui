import clsx from "clsx";
import { useState, useEffect, useCallback } from "react";

import { DynamicContentIcon } from "src/components/icons";
import { Tooltip } from "src/components/tooltip/tooltip.component";
import { SkylarkObjectContentObject } from "src/interfaces/skylark";

import {
  ObjectIdentifierCard,
  ObjectIdentifierCardProps,
} from "./objectIdentifierCard.component";

interface ContentObjectIdentifierCardProps extends ObjectIdentifierCardProps {
  object: SkylarkObjectContentObject;
  actualPosition: number;
  maxPosition: number;
  isNewObject?: boolean;
  canEditPosition?: boolean;
  onPositionChange: (p: number) => void;
}

const PositionInput = ({
  hasMoved,
  isNewObject,
  position,
  disabled,
  maxPosition,
  onBlur,
}: {
  hasMoved?: boolean;
  isNewObject?: boolean;
  position: number;
  disabled?: boolean;
  maxPosition: number;
  onBlur?: (n: number) => void;
}) => {
  const [value, setValue] = useState<number | "">(position);

  useEffect(() => {
    setValue(position);
  }, [position]);

  const onChange = useCallback((newValue: string) => {
    if (newValue === "") {
      setValue("");
      return;
    }
    const int = parseInt(newValue);
    if (!Number.isNaN(int)) setValue(int);
  }, []);

  const onBlurWrapper = useCallback(() => {
    if (!onBlur) return;

    if (value === "") {
      onBlur(position);
    } else if (value >= 1 && value <= maxPosition) {
      onBlur(value);
    } else {
      // If the value is less than 0 or more than the maximum allowed position, normalise it
      const minMaxedValue = value < 1 ? 1 : maxPosition;
      onBlur(minMaxedValue);
      setValue(minMaxedValue);
    }
  }, [maxPosition, onBlur, position, value]);

  return (
    <input
      type="text"
      disabled={disabled}
      size={value.toString().length || 1}
      style={{
        // Safari darkens the text on a disabled input
        WebkitTextFillColor: "#fff",
      }}
      className={clsx(
        "flex h-6 min-w-6 items-center justify-center rounded-full px-1 pb-0.5 text-center transition-colors",
        !isNewObject &&
          (!hasMoved || disabled) &&
          "bg-brand-primary text-white",
        !isNewObject && hasMoved && "bg-warning text-warning-content",
        isNewObject && "bg-success",
      )}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlurWrapper}
      value={value}
    />
  );
};

export const ContentObjectIdenfierCard = ({
  object,
  actualPosition,
  maxPosition,
  canEditPosition,
  isNewObject,
  onPositionChange,
  ...props
}: ContentObjectIdentifierCardProps) => {
  const { isDynamic, position } = object;
  return (
    <ObjectIdentifierCard
      {...props}
      object={object}
      showDragIcon={props.showDragIcon && !isDynamic}
      onDeleteClick={isDynamic ? undefined : props.onDeleteClick}
    >
      {isDynamic ? (
        <Tooltip
          tooltip={"Included in one or more dynamic content rules"}
          side="left"
        >
          <div>
            <DynamicContentIcon />
          </div>
        </Tooltip>
      ) : (
        <div className="flex">
          {canEditPosition && (
            <span
              className={clsx(
                "flex h-6 items-center justify-center px-0.5 text-manatee-400 transition-opacity",
                position === actualPosition || isNewObject
                  ? "opacity-0"
                  : "opacity-100",
              )}
            >
              {position}
            </span>
          )}
          <PositionInput
            disabled={!canEditPosition}
            position={actualPosition}
            hasMoved={!!canEditPosition && position !== actualPosition}
            isNewObject={canEditPosition && isNewObject}
            onBlur={onPositionChange}
            maxPosition={maxPosition}
          />
        </div>
      )}
    </ObjectIdentifierCard>
  );
};
