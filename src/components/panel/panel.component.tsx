import { Button } from "src/components/button";
import { Pill } from "src/components/pill";
import { Tabs } from "src/components/tabs/tabs.component";

export const Panel = ({}: any) => {
  return (
    <section
      style={{ zIndex: 999 }}
      className="fixed top-0 right-0 h-full w-2/5 bg-blue-200  "
    >
      <div className="p-5">
        <div className="flex flex-row ">
          <div className="">
            <Button variant="primary">Edit metada</Button>
            Expand
          </div>
          <div className="">
            <Button variant="ghost">close</Button>
          </div>
        </div>
        <div className="flex flex-row py-4">
          <Pill bgColor="#123123" label="Episode" />
          <h1 className="pl-4 text-2xl font-bold uppercase">Title</h1>
        </div>
      </div>

      <Tabs tabs={["One"]} />

      <div className="p-5">
        <h2 className="mt-10 text-xl font-semibold ">Global metadata</h2>

        <div>
          <h3 className="mt-4 mb-2 font-bold">Title</h3>
          <div className="text-base-content">Content</div>
        </div>
      </div>
    </section>
  );
};
