"use client";

import { Loader2 } from "lucide-react";

interface FormLoadingProps {
  message?: string;
}

export function FormLoading({ message = "Loading..." }: FormLoadingProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}
