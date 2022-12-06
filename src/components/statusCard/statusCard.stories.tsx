import { StatusCard, statusType } from "./statusCard.component";

export default {
  title: "Components/StatusCard",
  component: StatusCard,
};

const defaultProps = {
  title: "title",
  description: "lorem ipsum",
  status: statusType.pending,
  argTypes: {
    status: {
      options: [statusType],
      control: { type: "select" },
    },
  },
};

export const Default = () => <StatusCard {...defaultProps} />;
