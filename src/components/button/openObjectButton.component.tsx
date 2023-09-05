import { FiArrowRight } from "react-icons/fi";

interface GetOpenButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export const OpenObjectButton = ({ disabled, onClick }: GetOpenButtonProps) => (
  <button
    className="text-manatee-500 transition-colors hover:text-brand-primary disabled:text-manatee-300"
    onClick={onClick}
    aria-label="Open Object"
    disabled={disabled}
  >
    <FiArrowRight className="text-xl" />
  </button>
);
