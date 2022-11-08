import { QuickSearch } from "./search.component";

export default {
  title: "Components/Navigation/QuickSearch",
  component: QuickSearch,
};

export const Default = () => <QuickSearch onSearch={console.log} />;
