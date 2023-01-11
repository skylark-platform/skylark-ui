import { Button } from "src/components/button";
import { Expand } from "src/components/icons/expand.component";
import { Pill } from "src/components/pill";
import { Tabs } from "src/components/tabs/tabs.component";
import { useGetObject } from "src/hooks/useGetObject";

interface Props {
  objectType: string;
  togglePanel: () => void;
  uid: string;
}

export const Panel = ({ togglePanel, objectType, uid }: Props) => {
  const { data } = useGetObject(objectType, {
    uid: uid,
  });

  const getTitle = (object: { [k: string]: string }, priority: string[]) => {
    const [title] = priority.map((key) => object[key]).filter((key) => key);

    return title;
  };

  const orderedKeys = ["title", "name", "uid"];

  return (
    <div className="z-50">
      <section
        onClick={() => togglePanel()}
        className="fixed left-0 top-0 h-full w-3/5 bg-black bg-opacity-20"
      ></section>
      <section className="fixed top-0 right-0 h-full w-2/5 overflow-y-scroll bg-white drop-shadow-md ">
        {data && (
          <>
            <div className="p-5">
              <div className="flex flex-row ">
                <div className="pb-2">
                  {/*
                    <Button variant="primary">Edit metada</Button>
                    <button className="pl-3 align-middle">
                      <Expand className="stroke-black" />
                    </button>
                */}
                </div>
                <div className="absolute right-0 ">
                  <Button variant="ghost" onClick={() => togglePanel()}>
                    Close
                  </Button>
                </div>
              </div>
              <div className="flex flex-row items-center pt-5 ">
                <Pill bgColor="#226DFF" label="Episode" />
                <h1 className="pl-4 text-xl font-bold uppercase">
                  {getTitle(data?.getObject, orderedKeys)}
                </h1>
              </div>
            </div>

            <Tabs tabs={["Metadata"]} />

            <div className="p-5 ">
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
