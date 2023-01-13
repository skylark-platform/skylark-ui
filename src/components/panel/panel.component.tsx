import { Button } from "src/components/button";
import { Pill } from "src/components/pill";
import { Tabs } from "src/components/tabs/tabs.component";
import { useGetObject } from "src/hooks/useGetObject";

interface Props {
  objectType: string;
  closePanel: () => void;
  uid: string;
}

export const Panel = ({ closePanel, objectType, uid }: Props) => {
  const { data } = useGetObject(objectType, {
    uid: uid,
  });

  const getTitle = (object: Record<string, string>, priority: string[]) => {
    const [title] = priority.map((key) => object[key]).filter((key) => key);
    return title;
  };

  const orderedKeys = ["title", "name", "uid"];

  return (
    <div className="z-50">
      <section
        onClick={() => closePanel()}
        className="fixed left-0 top-0 h-full w-3/5 bg-black bg-opacity-20"
      ></section>
      <section className="fixed top-0 right-0 h-full w-2/5 overflow-y-scroll bg-white drop-shadow-md ">
        {data && (
          <>
            <div className="p-10">
              <div className="flex flex-row ">
                <div className="inline-flex items-center pb-2">
                  <Pill bgColor="#226DFF" label="Episode" />
                  <h1 className=" pl-4 text-xl font-bold uppercase">
                    {getTitle(data?.getObject, orderedKeys)}
                  </h1>
                  <div className="col-end-1 row-end-1 flex flex-row-reverse items-end self-end text-end">
                    <Button
                      className="text-end "
                      variant="ghost"
                      onClick={() => closePanel()}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Tabs tabs={["Metadata"]} />

            <div className="p-10 pb-12 pt-5 text-sm">
              {/* <h2 className="mt-4 text-xl font-semibold ">Global metadata</h2> */}
              <div>
                {data?.getObject &&
                  Object.keys(data?.getObject).map(
                    (element) =>
                      data?.getObject[element] &&
                      element !== "__typename" && (
                        <>
                          <h3 className="mt-4 mb-2 font-bold">{element}</h3>
                          <div className="text-base-content">
                            {data?.getObject[element]}
                          </div>
                        </>
                      ),
                  )}
                <h3 className="mt-4 mb-2 font-bold">Title</h3>
                <div className="text-base-content">
                  {data?.getObject?.title}
                </div>
                <h3 className="mt-4 mb-2 font-bold">Synopsis</h3>
                <div className="text-base-content">
                  {data?.getObject?.synopsis_medium}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
