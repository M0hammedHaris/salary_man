"use client";

import Image from "next/image";

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
import { cn } from "@/lib/utils";

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
        <FormItem className={cn("space-y-2", className)}>
          <FormLabel className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">
            {label}
          </FormLabel>
          <FormControl>
            <div className="space-y-4">
              {!receiptPreview ? (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[28px] p-8 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 transition-all group">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl text-primary">cloud_upload</span>
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="receipt-upload"
                        className="text-sm font-black text-foreground cursor-pointer hover:text-primary transition-colors inline-block"
                      >
                        Click to upload receipt
                      </label>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">PNG, JPG, PDF up to 10MB</p>
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
                <div className="border border-slate-200 dark:border-slate-800 rounded-[28px] p-4 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-500">task_alt</span>
                      <span className="text-sm font-black text-foreground">
                        Receipt uploaded
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onRemoveReceipt}
                      className="w-8 h-8 rounded-xl hover:bg-rose-50 hover:text-rose-500"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </Button>
                  </div>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    <Image
                      src={receiptPreview}
                      alt="Receipt preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </FormControl>
          <FormDescription className="text-xs font-medium ml-1">{description}</FormDescription>
          <FormMessage className="ml-1 font-bold text-xs" />
        </FormItem>
      )}
    />
  );
}
