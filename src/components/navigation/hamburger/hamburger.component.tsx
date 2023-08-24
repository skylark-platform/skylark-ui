import clsx from "clsx";
import { SlMenu } from "react-icons/sl";

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
    <SlMenu />
  </button>
);
