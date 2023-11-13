import { ContentModel } from "src/components/contentModel";

export default function ContentModelPage() {
  return (
    <div className="pt-nav">
      <div className="fixed z-[10000] w-full bg-warning flex justify-center items-center text-sm flex-col h-14">
        <p>This is an Alpha feature.</p>
        <p>
          Currently, you can only modify UI Config. Schema modifications are
          unsupported.
        </p>
      </div>
      <div className="pt-14">
        <ContentModel />
      </div>
    </div>
  );
}
