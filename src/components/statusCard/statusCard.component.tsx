import clsx from "clsx";
import Image from "next/image";

import CheckIcon from "public/icons/check-circle.svg";

export interface Props {
  title: string;
  description: string;
  status: string; // TODO enum "success" | "loading" | "error" | "hold"
}

export const StatusCard = ({ title, description, status }: Props) => {
  const combinedClassName = clsx(
    "mb-2 flex h-28 w-2/5 flex-row rounded border border-t-4 border-solid  bg-white p-5",
    status === "success" && "border-t-success",
    status === "loading" && "border-t-yellow-300",
    status === "error" && "border-t-red-300",
    status === "stale" && "border-t-grey-200",
  );
  return (
    <div className={combinedClassName}>
      <div className="w-4/5">
        <h4 className="font-bold">{title}</h4>
        <div>
          <p className="text-sm font-light">{description}</p>
        </div>
      </div>
      <div className="flex w-1/5 items-center justify-center">
        <Image
          className="fill-success text-success" // TODO not working
          src={"/icons/check-circle.svg"}
          width="20"
          height={"20"}
          alt=""
          color=""
        />
      </div>
    </div>
  );
};
