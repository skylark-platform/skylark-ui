interface Props {
  name: string;
}

export const objectLabel = ({ name }: Props) => {
  return (
    <div className="rounded-full ">
      <span className="">{name}</span>
    </div>
  );
};
