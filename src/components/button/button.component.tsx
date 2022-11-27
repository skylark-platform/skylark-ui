interface Props {
  title: string;
  // onClick: () => void;
}

export const Button = ({ title }: Props) => {
  return (
    <button
      className="rounded-full bg-brand-primary p-2 px-4 text-white"
      onClick={() => console.log("clicked")}
    >
      {title}
    </button>
  );
};
