"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TransactionFormWrapperProps {
  children: React.ReactNode;
  isModal?: boolean;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function TransactionFormWrapper({
  children,
  isModal = false,
  title,
  description,
  icon,
}: TransactionFormWrapperProps) {
  if (isModal) {
    return <div className="space-y-4">{children}</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
          )}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
