import clsx from "clsx";
import { FiMenu } from "react-icons/fi";

interface Props {
  onClick: () => void;
  className?: string;
}

export const Hamburger = ({ onClick, className }: Props) => (
  <button
    onClick={onClick}
    id="mobile-nav-toggle"
    className={clsx("z-50 text-2xl", className)}
  >
    <FiMenu />
  </button>
);
