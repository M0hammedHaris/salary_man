"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onCancel?: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  submitIcon?: React.ReactNode;
  loadingLabel?: string;
  cancelLabel?: string;
  isValid?: boolean;
}

export function FormActions({
  onCancel,
  isSubmitting,
  submitLabel,
  submitIcon,
  loadingLabel = "Saving...",
  cancelLabel = "Cancel",
  isValid = true,
}: FormActionsProps) {
  return (
    <div className="flex gap-3 justify-end">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        disabled={isSubmitting || !isValid}
        className="min-w-[120px]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          <>
            {submitIcon && <span className="mr-2">{submitIcon}</span>}
            {submitLabel}
          </>
        )}
      </Button>
    </div>
  );
}
