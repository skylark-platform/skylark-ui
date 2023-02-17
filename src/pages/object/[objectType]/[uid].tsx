import { useRouter } from "next/router";

import { Panel } from "src/components/panel";

const Object = () => {
  const router = useRouter();
  const { objectType, uid } = router.query;

  console.log({ objectType, uid });

  return (
    <div className="pt-nav flex w-full">
      {objectType && uid && (
        <div
          className="relative mx-auto w-full max-w-7xl"
          style={{
            maxHeight: `calc(100vh - 4rem)`,
          }}
        >
          <Panel
            closePanel={() => console.log("close")}
            uid={uid as string}
            objectType={objectType as string}
          />
        </div>
      )}
    </div>
  );
};

export default Object;
