import { Navigation } from "./navigation.component";

export default {
  title: "Components/Navigation",
  component: Navigation,
};

export const Default = () => <Navigation openAuthModal={() => ""} />;
