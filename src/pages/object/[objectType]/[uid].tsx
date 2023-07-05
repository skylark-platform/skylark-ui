import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

import { Panel } from "src/components/panel";
import { PanelTab } from "src/hooks/state";
import { SkylarkObjectIdentifier } from "src/interfaces/skylark";

const Object = () => {
  const router = useRouter();
  const { objectType, uid, language } = router.query;

  const [tab, setTab] = useState<PanelTab>(PanelTab.Metadata);

  const object = useMemo(
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
    setTab(PanelTab.Metadata);
  };

  return (
    <div className="pt-nav flex w-full">
      <Head>
        <title>{`Skylark | ${objectType} ${uid} (${language})`}</title>
      </Head>
      {object && (
        <div
          className="relative mx-auto w-full"
          style={{
            maxHeight: `calc(100vh - 4rem)`,
          }}
        >
          <Panel
            isPage
            object={object}
            tab={tab}
            setPanelObject={setPanelObject}
            setTab={setTab}
          />
        </div>
      )}
    </div>
  );
};

export default Object;
