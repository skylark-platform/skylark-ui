import { ArrowRight } from "src/components/icons";

interface GetOpenButtonProps {
  onClick: () => void;
}

export const OpenObjectButton = ({ onClick }: GetOpenButtonProps) => (
  <button
    className="text-manatee-500 transition-colors hover:text-brand-primary"
    onClick={onClick}
  >
    <ArrowRight />
  </button>
);
