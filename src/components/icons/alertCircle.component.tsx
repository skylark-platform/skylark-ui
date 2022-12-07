import { statusType } from "src/components/statusCard/statusCard.component";

interface Props {
  status: statusType;
}

const getColor = (status: statusType) => {
  switch (status) {
    case statusType.success:
      return "stroke-success";
    case statusType.pending:
      return "stroke-pending";
    case statusType.error:
      return "stroke-error-2";
    case statusType.inProgress:
      return "stroke-in-progress";
    default:
      break;
  }
};

export const AlertCircle = ({ status }: Props) => {
  return (
    <svg
      className={getColor(status)}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        // stroke="#0E1825"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M12 8V12"
        // stroke="#0E1825"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="12" cy="16" r="1" fill="#0E1825" />
    </svg>
  );
};
