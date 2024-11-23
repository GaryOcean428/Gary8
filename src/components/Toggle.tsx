'use client';

import { Switch } from "@nextui-org/react";

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function Toggle({ 
  enabled, 
  onChange, 
  size = "md", 
  disabled = false 
}: ToggleProps) {
  return (
    <Switch
      isSelected={enabled}
      onValueChange={onChange}
      size={size}
      isDisabled={disabled}
      classNames={{
        base: "inline-flex flex-row-reverse w-full max-w-md",
        wrapper: "group-data-[selected=true]:bg-primary",
      }}
    />
  );
}