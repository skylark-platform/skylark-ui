import { Button } from "src/components/button";
import { Expand } from "src/components/icons/expand.component";
import { Pill } from "src/components/pill";
import { Tabs } from "src/components/tabs/tabs.component";
import { useGetObject } from "src/hooks/useGetObject";

interface Props {
  objectType: string;
  uid: string;
}

export const Panel = ({}: any) => {
  const { data } = useGetObject("Episode", {
    uid: "01GP158MZD8SW5EC5P048C2V7V",
  });

  console.log(data?.getEpisode);

  return (
    <section
      style={{ zIndex: 999 }}
      className="fixed top-0 right-0 h-full w-2/5 bg-blue-100  drop-shadow-md"
    >
      <div className="p-5">
        <div className="flex flex-row ">
          <div className="pb-2">
            <Button variant="primary">Edit metada</Button>
            <button className="pl-3 align-middle">
              <Expand className="stroke-black" />
            </button>
          </div>
          <div className="absolute right-0">
            <Button variant="ghost">close</Button>
          </div>
        </div>
        <div className="flex flex-row pt-3 ">
          <Pill bgColor="#123123" label="Episode" />
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
  );
};
