import CheckIcon from "./check-circle.svg";

interface Props {
  title: string;
  description: string;
  status: string; // TODO enum "done" | "loading" | "error" | "hold"
}

export const StatusCard = ({ title, description }: Props) => {
  return (
    <div className="mb-2 flex h-24 w-1/2 flex-row rounded border border-t-4 border-solid border-t-green-500 bg-white p-5">
      <div className="w-4/5">
        <h4 className="">{title}</h4>
        <div>
          <p className="text-sm font-light">{description}</p>
        </div>
      </div>
      <div className="w-1/5"></div>
    </div>
  );
};
