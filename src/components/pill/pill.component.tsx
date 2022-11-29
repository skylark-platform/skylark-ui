export interface PillProps {
  label: string;
  bgColor: string;
}

export const Pill = ({ label, bgColor }: PillProps) => (
  <span
    // TODO determine text colour based on background
    className="badge border-none px-3 text-xs text-white"
    style={bgColor ? { backgroundColor: bgColor } : undefined}
  >
    {label}
  </span>
);
