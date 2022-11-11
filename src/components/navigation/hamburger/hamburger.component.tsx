import { SlMenu } from "react-icons/sl";

interface Props {
  onClick: () => void;
}

export const Hamburger = ({ onClick }: Props) => (
  <button
    onClick={onClick}
    id="mobile-nav-toggle"
    className="fixed right-5 top-4 z-50 text-4xl"
  >
    <SlMenu />
  </button>
);
