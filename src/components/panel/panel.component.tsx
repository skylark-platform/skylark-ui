import Image from "next/image";

import { Button } from "src/components/button";
import { Expand, Spinner } from "src/components/icons";
import { Pill } from "src/components/pill";
import { Tabs } from "src/components/tabs/tabs.component";
import { useGetObject } from "src/hooks/useGetObject";
import { formatObjectField } from "src/lib/utils";

interface PanelProps {
  objectType: string;
  closePanel: () => void;
  uid: string;
}

const getTitle = (object: Record<string, string>, priority: string[]) => {
  const [title] = priority.map((key) => object[key]).filter((key) => key);
  return title;
};

const orderedKeys = ["title", "name", "uid"];

export const Panel = ({ closePanel, objectType, uid }: PanelProps) => {
  const { data } = useGetObject(objectType, {
    uid: uid,
  });

  console.log("data", data);

  return (
    <>
      <div
        data-testid="panel-background"
        onClick={() => closePanel()}
        className="fixed left-0 top-0 bottom-0 z-50 w-3/5 bg-black bg-opacity-20 "
      />
      <section className="fixed top-0 right-0 bottom-0 z-50 flex w-full flex-col bg-white drop-shadow-md md:w-2/3 lg:w-7/12 xl:w-2/5 ">
        {!data && (
          <div
            data-testid="loading"
            className="flex h-full w-full items-center justify-center"
          >
            <Spinner className="h-16 w-16 animate-spin" />
          </div>
        )}
        {data && (
          <>
            <div
              data-testid="panel-header"
              className="p-4 pb-2 md:p-8 md:py-6 "
            >
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

            <Tabs tabs={["Metadata", "Imagery"]} />

            <div className=" h-full overflow-y-scroll p-4 pb-12 text-sm md:p-8">
              {data?.getObject &&
                Object.keys(data?.getObject).map((property) => {
                  console.log(property);
                  if (typeof data?.getObject[property] !== "string") {
                    console.log("here");
                    const images = data?.getObject[property]?.objects;
                    console.log("images", images);
                    return images?.map(({ url }) => {
                      console.log(url);
                      return (
                        <img
                          key={""}
                          // loader={myLoader}
                          src={url}
                          alt="Picture of the author"
                          width={500}
                          height={500}
                        />
                      );
                    });
                  }

                  return;
                })}
            </div>
          </>
        )}
      </section>
    </>
  );
};
