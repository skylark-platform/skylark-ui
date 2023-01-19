import { Spinner } from "src/components/icons";
import { Tabs } from "src/components/tabs/tabs.component";
import { useGetObject } from "src/hooks/useGetObject";

import { PanelAvailability } from "./panelAvailability/panelAvailability.component";
import { PanelHeader } from "./panelHeader/panelHeader.component";

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
  const { data, loading } = useGetObject(objectType, {
    uid: uid,
  });

  console.log({ uid, data, loading });

  return (
    <>
      <div
        data-testid="panel-background"
        onClick={() => closePanel()}
        className="fixed left-0 top-0 bottom-0 z-50 w-3/5 bg-black bg-opacity-20 "
      />
      <section className="fixed top-0 right-0 bottom-0 z-50 flex w-full flex-col bg-white drop-shadow-md md:w-2/3 lg:w-7/12 xl:w-2/5 ">
        {loading && (
          <div
            data-testid="loading"
            className="flex h-full w-full items-center justify-center"
          >
            <Spinner className="h-16 w-16 animate-spin" />
          </div>
        )}
        {!loading && data && (
          <>
            <PanelHeader
              title={getTitle(data.metadata, orderedKeys)}
              objectType={objectType}
              closePanel={closePanel}
            />

            <Tabs tabs={["Metadata", "Imagery", "Availability"]} />

            {/* {tab === 1 && <PanelAvailability availabilities={data.availability} />} */}
            <PanelAvailability availability={data.availability} />

            {/* <div className=" h-full overflow-y-scroll p-4 pb-12 text-sm md:p-8">
              {data.images.map((image) => (
                <div key={image.uid}>
                  <h3 className="mb-2 font-bold ">
                    {formatObjectField(image.title)}
                  </h3>
                  <img
                    key={""}
                    src={image.url}
                    alt="Picture of the author"
                    width={500}
                    height={500}
                  />
                </div>
              ))}
            </div> */}
          </>
        )}
      </section>
    </>
  );
};
