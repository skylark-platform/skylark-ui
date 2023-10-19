import { AnimatePresence, Transition, m } from "framer-motion";
import { ReactNode, useMemo } from "react";

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

  const strokeProps: {
    initial: object;
    animate: object;
    transition: Transition;
  } = useMemo(
    () => ({
      initial: { pathLength: 0, opacity: 1 },
      animate: { pathLength: 1, opacity: 0 },
      transition: {
        duration: speed === "fast" ? 0.8 : 2,
        ease: "easeInOut",
        opacity: {
          delay: speed === "fast" ? 0.5 : 1,
          duration: speed === "fast" ? 1 : 2,
        },
      },
    }),
    [speed],
  );

  return (
    <m.svg
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
        <m.path
          onAnimationStart={onAnimationStart}
          onAnimationComplete={onAnimationComplete}
          {...fillProps}
          d="M12 24C12 17.6348 14.5286 11.5303 19.0294 7.02944C23.5303 2.52856 29.6348 0 36 0H84C84 6.3652 81.4714 12.4697 76.9706 16.9706C72.4697 21.4714 66.3652 24 60 24H36C42.3652 24 48.4697 26.5286 52.9706 31.0294C57.4714 35.5303 60 41.6348 60 48H36C29.6348 48 23.5303 45.4714 19.0294 40.9706C14.5286 36.4697 12 30.3652 12 24Z"
          fill="#0E1825"
          strokeDasharray="0 1"
        />
        <m.path
          {...fillProps}
          d="M60 72H0C0 65.6348 2.52856 59.5303 7.02944 55.0294C11.5303 50.5286 17.6348 48 24 48H60L60 60Z"
          strokeDasharray="0 1"
          fill="#0D5AF1"
        />
        <m.path
          {...fillProps}
          strokeDasharray="0 1"
          d="M60 72C66.3652 72 72.4697 69.4714 76.9706 64.9706C81.4714 60.4697 84 54.3652 84 48C84 41.6348 81.4714 35.5303 76.9706 31.0294C72.4697 26.5286 66.3652 24 60 24H36C42.3652 24 48.4697 26.5286 52.9706 31.0294C57.4714 35.5303 60 41.6348 60 48V72Z"
          fill="url(#paint0_linear_1041_895)"
        />
        <m.path
          {...fillProps}
          d="M60 48H36L60 72V48Z"
          strokeDasharray="0 1"
          fill="url(#paint1_linear_1041_895)"
        />
      </g>
      <g>
        <m.path
          {...strokeProps}
          d="M12 24C12 17.6348 14.5286 11.5303 19.0294 7.02944C23.5303 2.52856 29.6348 0 36 0H84C84 6.3652 81.4714 12.4697 76.9706 16.9706C72.4697 21.4714 66.3652 24 60 24H36C42.3652 24 48.4697 26.5286 52.9706 31.0294C57.4714 35.5303 60 41.6348 60 48H36C29.6348 48 23.5303 45.4714 19.0294 40.9706C14.5286 36.4697 12 30.3652 12 24Z"
          stroke="#0E1825"
          strokeDasharray="0 1"
          strokeWidth={0.5}
        />
        <m.path
          {...strokeProps}
          d="M60 72H0C0 65.6348 2.52856 59.5303 7.02944 55.0294C11.5303 50.5286 17.6348 48 24 48H60L60 60Z"
          stroke="#0D5AF1"
          strokeDasharray="0 1"
          strokeWidth={0.5}
        />
        <m.path
          {...strokeProps}
          stroke="url(#paint0_linear_1041_895)"
          strokeDasharray="0 1"
          d="M60 72C66.3652 72 72.4697 69.4714 76.9706 64.9706C81.4714 60.4697 84 54.3652 84 48C84 41.6348 81.4714 35.5303 76.9706 31.0294C72.4697 26.5286 66.3652 24 60 24H36C42.3652 24 48.4697 26.5286 52.9706 31.0294C57.4714 35.5303 60 41.6348 60 48V72Z"
          strokeWidth={0.5}
        />
        <m.path
          {...strokeProps}
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
    </m.svg>
  );
};

export const AnimatedLogo = ({
  show,
  children,
  ...props
}: AnimatedLogoProps) => {
  return (
    <AnimatePresence>
      {show && (
        <m.div
          data-testid="animated-logo"
          className="absolute top-0 z-[99999999999] flex h-full w-full flex-col items-center justify-center pb-32"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <AnimatedSkylarkLogoSVG {...props} />
          {children && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: props.speed === "fast" ? 0.8 : 2,
                duration: props.speed === "fast" ? 0.6 : 1,
              }}
              className="mt-8 text-center font-heading text-6xl text-black"
            >
              {children}
            </m.div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
};
