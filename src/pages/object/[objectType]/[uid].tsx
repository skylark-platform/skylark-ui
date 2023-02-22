import { useRouter } from "next/router";

import { Panel } from "src/components/panel";

const Object = () => {
  const router = useRouter();
  const { objectType, uid } = router.query;

  return (
    <div className="pt-nav flex w-full">
      {objectType && uid && (
        <div
          className="relative mx-auto w-full max-w-7xl"
          style={{
            maxHeight: `calc(100vh - 4rem)`,
          }}
        >
          <Panel uid={uid as string} objectType={objectType as string} />
        </div>
      )}
    </div>
  );
};

export default Object;
