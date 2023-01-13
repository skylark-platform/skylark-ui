import { Button } from "src/components/button";
import { Expand } from "src/components/icons";
import { Pill } from "src/components/pill";
import { Tabs } from "src/components/tabs/tabs.component";
import { useGetObject } from "src/hooks/useGetObject";
import { formatObjectField } from "src/lib/utils";

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
    <>
      <div
        onClick={() => closePanel()}
        className="fixed left-0 top-0 z-50 h-full w-3/5 bg-black bg-opacity-20 "
      />
      <section className="fixed top-0 right-0 z-50 h-full w-full overflow-y-scroll bg-white drop-shadow-md md:w-2/3 lg:w-7/12 xl:w-2/5 ">
        {data && (
          <>
            <div className="p-4 pb-2 md:p-8">
              <div className="flex flex-row pb-2">
                <div className="flex flex-grow items-center gap-4">
                  <Button disabled variant="primary">
                    Edit metadata
                  </Button>
                  <Button
                    Icon={<Expand className="stroke-gray-300" />}
                    disabled
                    variant="ghost"
                  />
                </div>

                <Button variant="ghost" onClick={() => closePanel()}>
                  Close
                </Button>
              </div>
              <div className="flex flex-row items-center pt-5 ">
                <Pill bgColor="#226DFF" label={objectType} />
                <h1 className=" pl-4 text-xl font-bold uppercase">
                  {getTitle(data?.getObject, orderedKeys)}
                </h1>
              </div>
            </div>

            <Tabs tabs={["Metadata"]} />

            <div className="p-4 pb-12 text-sm md:p-8">
              {data?.getObject &&
                Object.keys(data?.getObject).map(
                  (element) =>
                    data?.getObject[element] &&
                    element !== "__typename" && (
                      <>
                        <h3 className="mb-2 font-bold ">
                          {formatObjectField(element)}
                        </h3>
                        <div className="mb-4 break-words text-base-content">
                          {data?.getObject[element]}
                        </div>
                      </>
                    ),
                )}
            </div>
          </>
        )}
      </section>
    </>
  );
};
