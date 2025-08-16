"use client";

import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { type Control, type FieldValues, type Path } from "react-hook-form";

interface ReceiptUploadFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  receiptPreview: string | null;
  onReceiptUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReceipt: () => void;
  label?: string;
  description?: string;
  className?: string;
}

export function ReceiptUploadField<T extends FieldValues>({
  control,
  name,
  receiptPreview,
  onReceiptUpload,
  onRemoveReceipt,
  label = "Receipt (Optional)",
  description = "Upload a receipt for this transaction",
  className = "sm:col-span-2",
}: ReceiptUploadFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="space-y-4">
              {!receiptPreview ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      <label
                        htmlFor="receipt-upload"
                        className="font-medium text-primary cursor-pointer hover:underline"
                      >
                        Click to upload receipt
                      </label>
                      <p>PNG, JPG, PDF up to 10MB</p>
                    </div>
                    <input
                      id="receipt-upload"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={onReceiptUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Receipt uploaded
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onRemoveReceipt}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Image
                    src={receiptPreview}
                    alt="Receipt preview"
                    width={300}
                    height={200}
                    className="w-full max-w-xs mx-auto rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
