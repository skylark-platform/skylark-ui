import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

import { Panel } from "src/components/panel";
import { PanelTab, PanelTabState, mergedPanelTabStates } from "src/hooks/state";
import { SkylarkObjectIdentifier } from "src/interfaces/skylark";

const Object = () => {
  const router = useRouter();
  const { objectType, uid, language } = router.query;

  const [tab, setTab] = useState<PanelTab>(PanelTab.Metadata);

  const [tabState, setTabState] = useState<PanelTabState>({
    [PanelTab.Relationships]: {
      active: null,
    },
  });

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
        <title>{`Skylark | ${objectType || "Object"} ${uid || ""} ${
          language ? `(${language})` : ""
        }`}</title>
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
            tabState={tabState}
            setPanelObject={setPanelObject}
            setTab={setTab}
            updateActivePanelTabState={(newTabState) =>
              setTabState((prevTabState) =>
                mergedPanelTabStates(prevTabState, newTabState),
              )
            }
          />
        </div>
      )}
    </div>
  );
};

export default Object;
