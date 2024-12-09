import clsx from "clsx";
import { AnimatePresence, Transition, motion } from "framer-motion";
import { ReactNode, useMemo } from "react";

import { Spinner } from "src/components/icons";

interface AnimatedLogoProps {
  show: boolean;
  speed?: "normal" | "fast";
  className?: string;
  children?: ReactNode;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

const svgVariants = {
  open: {
    opacity: 1,
    transition: {
      duration: 1,
    },
  },
  closed: {
    opacity: 0,
    transition: {
      duration: 1,
    },
  },
};

const strokeInitial = { pathLength: 0, opacity: 1 };
const strokeAnimate = { pathLength: 1, opacity: 0 };

const AnimatedSkylarkLogoSVG = ({
  speed,
  className,
  onAnimationComplete,
  onAnimationStart,
}: Omit<AnimatedLogoProps, "show" | "children">) => {
  const fillProps: {
    initial: object;
    animate: object;
    transition: Transition;
  } = useMemo(
    () => ({
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: {
        duration: speed === "fast" ? 0.8 : 1.5,
        delay: speed === "fast" ? 0.6 : 2,
        ease: "easeInOut",
      },
    }),
    [speed],
  );

  const strokeTransition: Transition = useMemo(
    () => ({
      duration: speed === "fast" ? 0.8 : 2,
      ease: "easeInOut",
      opacity: {
        delay: speed === "fast" ? 0.5 : 1,
        duration: speed === "fast" ? 1 : 2,
      },
    }),
    [speed],
  );

  return (
    <motion.svg
      className={className}
      width={168}
      height={144}
      viewBox="0 0 84 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      variants={svgVariants}
      initial="closed"
      animate="open"
    >
      {/* <rect x="36" y="24" width="24" height="24" fill="#0E1825" /> */}
      <g>
        <motion.path
          onAnimationStart={onAnimationStart}
          onAnimationComplete={onAnimationComplete}
          initial={strokeInitial}
          animate={strokeAnimate}
          transition={strokeTransition}
          d="M12 24C12 17.6348 14.5286 11.5303 19.0294 7.02944C23.5303 2.52856 29.6348 0 36 0H84C84 6.3652 81.4714 12.4697 76.9706 16.9706C72.4697 21.4714 66.3652 24 60 24H36C42.3652 24 48.4697 26.5286 52.9706 31.0294C57.4714 35.5303 60 41.6348 60 48H36C29.6348 48 23.5303 45.4714 19.0294 40.9706C14.5286 36.4697 12 30.3652 12 24Z"
          fill="#0E1825"
          strokeDasharray="0 1"
        />
        <motion.path
          initial={strokeInitial}
          animate={strokeAnimate}
          transition={strokeTransition}
          d="M60 72H0C0 65.6348 2.52856 59.5303 7.02944 55.0294C11.5303 50.5286 17.6348 48 24 48H60L60 60Z"
          strokeDasharray="0 1"
          fill="#0D5AF1"
        />
        <motion.path
          initial={strokeInitial}
          animate={strokeAnimate}
          transition={strokeTransition}
          strokeDasharray="0 1"
          d="M60 72C66.3652 72 72.4697 69.4714 76.9706 64.9706C81.4714 60.4697 84 54.3652 84 48C84 41.6348 81.4714 35.5303 76.9706 31.0294C72.4697 26.5286 66.3652 24 60 24H36C42.3652 24 48.4697 26.5286 52.9706 31.0294C57.4714 35.5303 60 41.6348 60 48V72Z"
          fill="url(#paint0_linear_1041_895)"
        />
        <motion.path
          initial={strokeInitial}
          animate={strokeAnimate}
          transition={strokeTransition}
          d="M60 48H36L60 72V48Z"
          strokeDasharray="0 1"
          fill="url(#paint1_linear_1041_895)"
        />
      </g>
      <g>
        <motion.path
          initial={strokeInitial}
          animate={strokeAnimate}
          transition={strokeTransition}
          d="M12 24C12 17.6348 14.5286 11.5303 19.0294 7.02944C23.5303 2.52856 29.6348 0 36 0H84C84 6.3652 81.4714 12.4697 76.9706 16.9706C72.4697 21.4714 66.3652 24 60 24H36C42.3652 24 48.4697 26.5286 52.9706 31.0294C57.4714 35.5303 60 41.6348 60 48H36C29.6348 48 23.5303 45.4714 19.0294 40.9706C14.5286 36.4697 12 30.3652 12 24Z"
          stroke="#0E1825"
          strokeDasharray="0 1"
          strokeWidth={0.5}
        />
        <motion.path
          initial={strokeInitial}
          animate={strokeAnimate}
          transition={strokeTransition}
          d="M60 72H0C0 65.6348 2.52856 59.5303 7.02944 55.0294C11.5303 50.5286 17.6348 48 24 48H60L60 60Z"
          stroke="#0D5AF1"
          strokeDasharray="0 1"
          strokeWidth={0.5}
        />
        <motion.path
          initial={strokeInitial}
          animate={strokeAnimate}
          transition={strokeTransition}
          stroke="url(#paint0_linear_1041_895)"
          strokeDasharray="0 1"
          d="M60 72C66.3652 72 72.4697 69.4714 76.9706 64.9706C81.4714 60.4697 84 54.3652 84 48C84 41.6348 81.4714 35.5303 76.9706 31.0294C72.4697 26.5286 66.3652 24 60 24H36C42.3652 24 48.4697 26.5286 52.9706 31.0294C57.4714 35.5303 60 41.6348 60 48V72Z"
          strokeWidth={0.5}
        />
        <motion.path
          initial={strokeInitial}
          animate={strokeAnimate}
          transition={strokeTransition}
          d="M60 48H36L60 72V48Z"
          strokeDasharray="0 1"
          stroke="url(#paint1_linear_1041_895)"
          strokeWidth={0.5}
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_1041_895"
          x1="60"
          y1="24"
          x2="60"
          y2="58.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.347826" stopColor="#226DFF" />
          <stop offset="1" stopColor="#0D5AF1" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_1041_895"
          x1="60"
          y1="48"
          x2="48"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopOpacity="0.35" />
          <stop offset="1" stopOpacity="0" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

const AnimatedChristmasHatSVG = ({
  speed,
  className,
  onAnimationComplete,
  onAnimationStart,
}: Omit<AnimatedLogoProps, "show" | "children">) => {
  const transition: Transition = useMemo(
    () => ({
      duration: speed === "fast" ? 0.4 : 1,
      delay: speed === "fast" ? 1 : 2,
      type: "spring",
      bounce: 0.5,
    }),
    [speed],
  );

  return (
    <motion.svg
      className={className}
      width={168}
      height={144}
      viewBox="0 0 412 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, y: -40, x: -40, rotate: -60 }}
      animate={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
      transition={transition}
      onAnimationStart={onAnimationStart}
      onAnimationComplete={onAnimationComplete}
    >
      <motion.path
        d="M 154 3.051 C 154 3.955, 61.697 129.991, 57.001 135.500 L 55.296 137.500 56.398 142.422 L 57.500 147.343 112.864 79.672 C 143.314 42.452, 168.460 12, 168.746 12 C 169.031 12, 170.892 12.972, 172.882 14.160 C 180.165 18.508, 174.220 14.079, 164.786 8.127 C 154.490 1.633, 154 1.402, 154 3.051 M 47.288 148.250 C 42.951 153.917, 40.665 157.299, 41.521 156.782 C 42.703 156.068, 49.343 147, 48.685 147 C 48.443 147, 47.814 147.563, 47.288 148.250"
        stroke="none"
        fill="#a3211d"
        fill-rule="evenodd"
      />
      <motion.path
        d="M 19.500 156.665 C 15.091 158.995, 13.013 161.058, 10.894 165.210 L 9 168.920 9 173.500 L 9 178.080 10.991 181.982 C 13.545 186.988, 18.340 190.620, 24.102 191.911 L 28.661 192.932 32.580 191.868 C 34.736 191.283, 38.016 189.659, 39.869 188.260 L 43.238 185.717 45.232 181.209 L 47.226 176.701 46.762 171.875 L 46.298 167.049 43.648 163.044 L 40.998 159.040 37.039 157.020 L 33.080 155 27.790 155.040 L 22.500 155.080 19.500 156.665"
        stroke="none"
        fill="#ffffff"
        fill-rule="evenodd"
        strokeDasharray="0 1"
      />

      <motion.path
        d="M 154 3.051 C 154 3.955, 61.697 129.991, 57.001 135.500 L 55.296 137.500 56.398 142.422 L 57.500 147.343 112.864 79.672 C 143.314 42.452, 168.460 12, 168.746 12 C 169.031 12, 170.892 12.972, 172.882 14.160 C 180.165 18.508, 174.220 14.079, 164.786 8.127 C 154.490 1.633, 154 1.402, 154 3.051 M 47.288 148.250 C 42.951 153.917, 40.665 157.299, 41.521 156.782 C 42.703 156.068, 49.343 147, 48.685 147 C 48.443 147, 47.814 147.563, 47.288 148.250"
        stroke="none"
        fill="#a3211d"
        fill-rule="evenodd"
        strokeDasharray="0 1"
      />
      <motion.path
        d="M 94.500 25.017 L 35.500 46.770 35.249 48.635 C 35.028 50.273, 28 151.848, 28 153.397 C 28 153.729, 28.824 154, 29.831 154 C 30.837 154, 33.762 155.064, 36.331 156.364 L 41 158.728 41 157.714 C 41 157.156, 48.119 147.204, 56.821 135.600 C 85.362 97.535, 154.194 3.859, 153.843 3.558 C 153.654 3.397, 126.950 13.053, 94.500 25.017 M 114.903 77.155 C 85.531 113.044, 60.680 143.440, 59.679 144.702 L 57.857 146.997 62.137 166.032 L 66.418 185.066 67.503 184.783 C 68.100 184.627, 108.258 156.600, 156.743 122.500 L 244.897 60.500 243.698 59.363 C 242.219 57.960, 171.506 13.131, 169.646 12.418 L 168.305 11.903 114.903 77.155"
        stroke="none"
        fill="#bf2722"
        fill-rule="evenodd"
        strokeDasharray="0 1"
      />
      <motion.path
        d="M 248.500 58.873 C 244.505 60.700, 69.528 183.298, 65.228 187.284 C 63.979 188.442, 61.794 191.765, 60.374 194.668 L 57.791 199.948 57.737 205.724 L 57.684 211.500 59.687 216 C 61.866 220.895, 66.765 226.215, 71.500 228.827 L 74.500 230.483 83.087 230.491 L 91.673 230.500 97.587 226.574 C 115.604 214.613, 273.100 103.187, 276.267 100.161 C 278.339 98.181, 280.927 94.717, 282.017 92.465 L 284 88.369 284 83.050 C 284 75.708, 282.297 70.707, 278.145 65.856 L 274.611 61.728 269.556 59.374 L 264.500 57.020 258.500 57.032 L 252.500 57.044 248.500 58.873"
        stroke="none"
        fill="#f2f2f2"
        fill-rule="evenodd"
        strokeDasharray="0 1"
      />
      <defs>
        <linearGradient
          id="paint0_linear_1041_895"
          x1="60"
          y1="24"
          x2="60"
          y2="58.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.347826" stopColor="#226DFF" />
          <stop offset="1" stopColor="#0D5AF1" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_1041_895"
          x1="60"
          y1="48"
          x2="48"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopOpacity="0.35" />
          <stop offset="1" stopOpacity="0" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

export const AnimatedLogo = ({
  show,
  children,
  withLoadingSpinner,
  hideLoadingSpinner,
  withBackground,
  ...props
}: AnimatedLogoProps & {
  withLoadingSpinner?: boolean;
  hideLoadingSpinner?: boolean;
  withBackground?: boolean;
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          data-testid="animated-skylark-logo"
          className={clsx(
            "fixed left-0 right-0 top-0 z-[99999999999] flex h-full w-full flex-col items-center justify-center pb-10",
            withBackground && "bg-white/60",
            withLoadingSpinner ? "pb-8" : "pb-32",
          )}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative">
            {/* <Snowfall
              style={{
                position: "fixed",
                height: "40vh",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 0,
              }}
              snowflakeCount={800}
            /> */}
            <AnimatedSkylarkLogoSVG
              {...props}
              className="h-16 md:h-28 xl:h-32 2xl:h-36"
            />
            {/* <AnimatedChristmasHatSVG
              {...props}
              onAnimationStart={undefined}
              onAnimationComplete={
                props.onAnimationComplete
                  ? () => setTimeout(() => props.onAnimationComplete?.(), 400)
                  : undefined
              }
              className="absolute -top-5 -left-2 md:-top-9 md:-left-3 xl:-top-16 xl:-left-3 2xl:-top-20 2xl:-left-4 h-20 md:h-36 xl:h-56 2xl:h-64"
            /> */}
            {children && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: props.speed === "fast" ? 0.8 : 2,
                  duration: props.speed === "fast" ? 0.6 : 1,
                }}
                className="mt-8 text-center font-heading text-6xl text-black"
              >
                {children}
              </motion.div>
            )}
          </div>
          {withLoadingSpinner && (
            <Spinner
              className={clsx(
                "mt-10 h-14 w-14 animate-spin transition-opacity",
                hideLoadingSpinner ? "opacity-0" : "opacity-100",
              )}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
