import { StatusCard, statusType } from "./statusCard.component";

export default {
  title: "Components/StatusCard",
  component: StatusCard,
};

const defaultProps = {
  title: "title",
  description: "lorem ipsum",
  status: statusType.success,
};

export const Default = () => <StatusCard {...defaultProps} />;
