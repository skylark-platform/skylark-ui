import { useRouter } from "next/router";
import { useMemo } from "react";

import { Panel } from "src/components/panel";
import { SkylarkObjectIdentifier } from "src/interfaces/skylark";

const Object = () => {
  const router = useRouter();
  const { objectType, uid, language } = router.query;

  const queryObject = useMemo(
    () =>
      objectType && uid
        ? {
            uid: uid as string,
            objectType: objectType as string,
            language: (language as string) || "",
          }
        : null,
    [language, objectType, uid],
  );

  const setPanelObject = ({
    uid,
    objectType,
    language,
  }: SkylarkObjectIdentifier) => {
    router.push({
      pathname: "/object/[objectType]/[uid]",
      query: { uid, objectType, language },
    });
  };

  return (
    <div className="pt-nav flex w-full">
      {queryObject && (
        <div
          className="relative mx-auto w-full"
          style={{
            maxHeight: `calc(100vh - 4rem)`,
          }}
        >
          <Panel isPage object={queryObject} setPanelObject={setPanelObject} />
        </div>
      )}
    </div>
  );
};

export default Object;
