import { StatusCard } from "./statusCard.component";

export default {
  title: "Components/StatusCard",
  component: StatusCard,
};

const defaultProps = {
  title: "title",
  description: "lorem ipsum",
  status: "completed",
};

export const Default = () => <StatusCard {...defaultProps} />;
