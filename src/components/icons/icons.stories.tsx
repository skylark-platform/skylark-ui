import { CheckCircle } from "./checkCircle.component";

export default {
  title: "Components/StatusCard",
  component: CheckCircle,
};

const defaultProps = {
  className: "title",
};

export const Default = () => <CheckCircle {...defaultProps} />;
