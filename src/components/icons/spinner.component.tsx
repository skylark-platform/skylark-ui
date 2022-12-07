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

export const Spinner = ({ status }: Props) => {
  return (
    <svg
      className={`animate-spin ${getColor(status)}`}
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.366 5.23134C19.0123 3.03339 16.9287 1.38156 14.4799 0.564933C12.031 -0.251691 9.37302 -0.181078 6.97102 0.764411C4.56901 1.7099 2.57603 3.47003 1.3409 5.73675C0.105763 8.00347 -0.292849 10.6324 0.214829 13.1634C0.722508 15.6943 2.10413 17.9661 4.1179 19.5812C6.13166 21.1962 8.64927 22.0516 11.2301 21.9976C13.8109 21.9436 16.2905 20.9837 18.235 19.2858C20.1794 17.588 21.4648 15.2604 21.8662 12.7104L19.389 12.3204C19.0791 14.2891 18.0868 16.0861 16.5856 17.3969C15.0844 18.7077 13.1701 19.4488 11.1776 19.4904C9.18517 19.5321 7.24151 18.8718 5.68683 17.6249C4.13215 16.3781 3.0655 14.6242 2.67355 12.6702C2.28161 10.7162 2.58935 8.6866 3.54291 6.93663C4.49647 5.18666 6.0351 3.82779 7.88951 3.09785C9.74393 2.3679 11.796 2.31339 13.6865 2.94384C15.5771 3.5743 17.1857 4.84956 18.2308 6.54643L20.366 5.23134Z"
        fill="url(#paint0_angular_383_55410)"
      />
      <defs>
        <radialGradient
          id="paint0_angular_383_55410"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(11 11) rotate(20.2249) scale(10.1242 28.5091)"
        >
          <stop stop-color="#D9D9D9" />
          <stop offset="1" stop-color="#D9D9D9" stop-opacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
