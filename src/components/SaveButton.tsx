'use client';

import { Button } from "@nextui-org/react";
import { Save } from "lucide-react";

interface SaveButtonProps {
  onSave: () => Promise<void>;
  isDirty: boolean;
  disabled?: boolean;
}

export function SaveButton({ 
  onSave, 
  isDirty, 
  disabled = false 
}: SaveButtonProps) {
  return (
    <Button
      color="primary"
      variant="solid"
      startContent={<Save className="w-4 h-4" />}
      isDisabled={!isDirty || disabled}
      onClick={onSave}
    >
      Save Changes
    </Button>
  );
}