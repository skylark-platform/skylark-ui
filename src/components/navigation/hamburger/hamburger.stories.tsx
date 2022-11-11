import { Hamburger } from "./hamburger.component";

export default {
  title: "Components/Navigation/Hamburger",
  component: Hamburger,
};

export const Default = () => <Hamburger onClick={() => alert("clicked")} />;
