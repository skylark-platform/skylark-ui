import { ButtonProps } from "src/components/button";

export interface BaseIntegrationUploaderProps {
  buttonProps: Omit<ButtonProps, "onClick">;
  onSuccess: () => void;
}
