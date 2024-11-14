import { sentenceCase } from "change-case";
import clsx from "clsx";
import dayjs from "dayjs";
import { FiMoreVertical } from "react-icons/fi";

import {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuOption,
} from "src/components/dropdown/dropdown.component";
import { PanelSectionTitle } from "src/components/panel/panelTypography";
import { UserAvatar } from "src/components/user";
import { useGetObjectVersions } from "src/hooks/objects/get/useGetObjectVersions";
import { useUserAccount } from "src/hooks/useUserAccount";
import { SkylarkObjectMetadataField } from "src/interfaces/skylark";

interface PanelMetadataVersionHistoryProps {
  uid: string;
  objectType: string;
  language: string;
}

const FieldDiff = ({
  newValue,
  oldValue,
}: {
  newValue: SkylarkObjectMetadataField;
  oldValue: SkylarkObjectMetadataField;
}) => {
  const commonClassName = "border rounded-sm p-0.5 bg-manatee-100 my-0.5";

  if (newValue === null) {
    return (
      <span
        className={clsx(commonClassName, "border-error line-through")}
      >{`${oldValue}`}</span>
    );
  }

  if (oldValue === null) {
    return (
      <span className={clsx(commonClassName, "border-success")}>
        {`${newValue}`}
      </span>
    );
  }

  return (
    <>
      <span
        className={clsx(commonClassName, "border-error line-through")}
      >{`${oldValue}`}</span>
      <span className="mx-0.5">{`->`}</span>
      <span
        className={clsx(commonClassName, "border-success")}
      >{`${newValue}`}</span>
    </>
  );
};

export const PanelMetadataVersionHistory = ({
  objectType,
  uid,
  language,
}: PanelMetadataVersionHistoryProps) => {
  const { role } = useUserAccount();

  const { versions } = useGetObjectVersions(objectType, uid, {
    language,
  });

  return (
    <div
      className="w-96 overflow-y-hidden hidden md:block"
      data-testid="panel-metadata-version-history"
    >
      <div className="overflow-y-scroll h-full p-6 md:p-8">
        <PanelSectionTitle text="History" />
        {versions?.combined
          .filter(
            (version) =>
              version.modifiedFields && version.modifiedFields.length > 0,
          )
          .map((version) => {
            const isCurrentUser = role === version.user;

            const dropdownMenuOptions: DropdownMenuOption[] = [
              {
                id: "language-version",
                text: `${language} version: ${version.language}`,
              },
              {
                id: "global-version",
                text: `Global version: ${version.global}`,
              },
            ];

            return (
              <div key={version.id} className="mb-8 text-manatee-600 relative">
                <div className="-left-8 -top-0.5 absolute">
                  <UserAvatar
                    name={version.user}
                    src=""
                    small
                    fallbackClassName={!isCurrentUser ? "bg-warning" : ""}
                  />
                </div>
                <div className="flex justify-between gap-2">
                  <p className="text-xs">
                    <span className="capitalize">
                      {isCurrentUser
                        ? "You"
                        : version.user.replaceAll("_", " ").toLocaleLowerCase()}
                    </span>
                    {` ${version.isInitialVersion ? "created" : "edited"} this object`}
                  </p>
                  <p className="text-xs text-right">{`${dayjs(version.date).fromNow()}`}</p>
                </div>
                <div className="rounded bg-manatee-200 p-4 mt-2 relative">
                  <div className="absolute right-0.5 top-2">
                    <DropdownMenu
                      options={dropdownMenuOptions}
                      placement="bottom-end"
                    >
                      <DropdownMenuButton
                        className="focus:outline-none focus-visible:ring-2 group-hover:text-black text-lg"
                        aria-label="Open Panel Menu"
                      >
                        <FiMoreVertical />
                      </DropdownMenuButton>
                    </DropdownMenu>
                  </div>
                  {version.modifiedFields?.map(({ field, values }) => (
                    <div className="mb-2" key={field}>
                      <p className="text-xs mb-0.5">{sentenceCase(field)}</p>
                      <div className="text-xs flex items-center flex-wrap">
                        <FieldDiff
                          newValue={values.new}
                          oldValue={values.old}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
