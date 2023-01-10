import { useEffect, useState } from "react";

import { Button } from "src/components/button";
import { Expand } from "src/components/icons/expand.component";
import { Pill } from "src/components/pill";
import { Tabs } from "src/components/tabs/tabs.component";
import { useGetObject } from "src/hooks/useGetObject";
import { usePanel } from "src/hooks/usePanel";

interface Props {
  objectType: string;
  uid: string;
  // isOpen: boolean;
}

export const Panel = ({ isOpen = true, toggle }: any) => {
  const { data } = useGetObject("Episode", {
    uid: "01GP158MZD8SW5EC5P048C2V7V",
  });

  console.log("#", data?.getObject);

  // const { isPanelOpen, toggle } = usePanel();
  // const [isPanelOpen, setOpen] = useState(isOpen);

  // TODO
  const orderedKeys = ["title", "name", "uid"];

  // if (!isPanelOpen) return <></>;

  return (
    <div className="z-50 ">
      <section
        onClick={() => toggle()}
        className="fixed left-0 top-0 h-full w-3/5 bg-black bg-opacity-20"
      ></section>
      <section className="fixed top-0 right-0 h-full w-2/5 bg-white drop-shadow-md ">
        <div className="p-5">
          <div className="flex flex-row ">
            <div className="pb-2">
              <Button variant="primary">Edit metada</Button>
              <button className="pl-3 align-middle">
                <Expand className="stroke-black" />
              </button>
            </div>
            <div className="absolute right-0 ">
              <Button variant="ghost" onClick={() => toggle()}>
                Close
              </Button>
            </div>
          </div>
          <div className="flex flex-row items-center pt-3 ">
            <Pill bgColor="#226DFF" label="Episode" />
            <h1 className="pl-4 text-xl font-bold uppercase">Title</h1>
          </div>
        </div>

        <Tabs tabs={["Metadata", "Versions"]} />

        <div className="p-5 ">
          <h2 className="mt-4 text-xl font-semibold ">Global metadata</h2>

          <div>
            <h3 className="mt-4 mb-2 font-bold">Title</h3>
            <div className="text-base-content">{data?.getEpisode.title}</div>
            <h3 className="mt-4 mb-2 font-bold">Synopsis</h3>
            <div className="text-base-content">
              {data?.getEpisode.synopsis_medium}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
