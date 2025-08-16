"use client";

interface FormErrorProps {
  error: string;
}

export function FormError({ error }: FormErrorProps) {
  return (
    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
      {error}
    </div>
  );
}
