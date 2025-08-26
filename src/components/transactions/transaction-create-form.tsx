"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Zap,
  Split,
  Copy,
  BookOpen,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTransactionSchema,
  type CreateTransactionRequest,
} from "@/lib/types/transaction";
import {
  AccountSelectionField,
  AmountInputField,
  CategorySelectionField,
  TransactionDateField,
  DescriptionField,
  ReceiptUploadField,
  useFormData,
  createReceiptHandlers,
  suggestCategory,
  type ReceiptHandlers
} from "./shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TransactionCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

interface TransactionTemplate {
  id: string;
  name: string;
  amount: string;
  description: string;
  categoryId: string;
  accountId?: string;
}

interface SplitEntry {
  categoryId: string;
  amount: string;
  description: string;
}

export function TransactionCreateForm({
  onSuccess,
  onCancel,
  isModal = false,
}: TransactionCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [showSplitMode, setShowSplitMode] = useState(false);
  const [splitEntries, setSplitEntries] = useState<SplitEntry[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBulkMode, setShowBulkMode] = useState(false);
  const [bulkEntries, setBulkEntries] = useState<CreateTransactionRequest[]>([]);

  const { formData, isLoading } = useFormData();

  const form = useForm<CreateTransactionRequest>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      accountId: "",
      amount: "",
      description: "",
      categoryId: "",
      transactionDate: new Date().toISOString(),
      receiptUrl: undefined,
    },
  });

  // Watch description field for smart suggestions
  const watchedDescription = form.watch("description");

  const { handleReceiptUpload, removeReceipt }: ReceiptHandlers = createReceiptHandlers(
    setReceiptPreview,
    (url) => form.setValue('receiptUrl', url)
  );

  // Auto-suggest category when description changes
  useEffect(() => {
    if (watchedDescription && watchedDescription.length >= 3) {
      const currentCategoryId = form.getValues("categoryId");
      if (!currentCategoryId) {
        const suggestedCategoryId = suggestCategory(watchedDescription, formData.categories);
        if (suggestedCategoryId) {
          // Auto-select suggested category after a short delay
          setTimeout(() => {
            form.setValue("categoryId", suggestedCategoryId);
          }, 500);
        }
      }
    }
  }, [watchedDescription, form, formData.categories]);

  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem("transactionTemplates");
    const loadedTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];
    setTemplates(loadedTemplates);
  }, []);

  // Split transaction functions
  const addSplitEntry = () => {
    setSplitEntries((prev) => [
      ...prev,
      { categoryId: "", amount: "", description: "" },
    ]);
  };

  const removeSplitEntry = (index: number) => {
    setSplitEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSplitEntry = (
    index: number,
    field: keyof SplitEntry,
    value: string
  ) => {
    setSplitEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const calculateSplitTotal = () => {
    return splitEntries
      .reduce((total, entry) => {
        const amount = parseFloat(entry.amount) || 0;
        return total + amount;
      }, 0)
      .toFixed(2);
  };

  const getSplitDifference = () => {
    const transactionAmount = Math.abs(parseFloat(form.watch("amount")) || 0);
    const splitTotal = parseFloat(calculateSplitTotal());
    return splitTotal - transactionAmount;
  };

  // Template functions
  const saveAsTemplate = () => {
    const formValues = form.getValues();
    if (
      !formValues.description ||
      !formValues.amount ||
      !formValues.categoryId
    ) {
      form.setError("root", {
        message:
          "Please fill out description, amount, and category before saving as template",
      });
      return;
    }

    const templateName = prompt("Enter a name for this template:");
    if (!templateName) return;

    const newTemplate: TransactionTemplate = {
      id: Date.now().toString(),
      name: templateName,
      amount: Math.abs(parseFloat(formValues.amount)).toString(),
      description: formValues.description,
      categoryId: formValues.categoryId,
      accountId: formValues.accountId,
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);

    // In production, you'd save this to the backend
    localStorage.setItem(
      "transactionTemplates",
      JSON.stringify(updatedTemplates)
    );
  };

  const applyTemplate = (template: TransactionTemplate) => {
    form.setValue("description", template.description);
    form.setValue("amount", template.amount);
    form.setValue("categoryId", template.categoryId);
    if (template.accountId) {
      form.setValue("accountId", template.accountId);
    }
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter((t) => t.id !== templateId);
    setTemplates(updatedTemplates);

    // In production, you'd delete this from the backend
    localStorage.setItem(
      "transactionTemplates",
      JSON.stringify(updatedTemplates)
    );
  };

  // Bulk entry functions
  const addBulkEntry = () => {
    setBulkEntries((prev) => [
      ...prev,
      {
        accountId: "",
        amount: "",
        description: "",
        categoryId: "",
        transactionDate: new Date().toISOString(),
        receiptUrl: undefined,
      },
    ]);
  };

  const removeBulkEntry = (index: number) => {
    setBulkEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBulkEntry = (
    index: number,
    field: keyof CreateTransactionRequest,
    value: string
  ) => {
    setBulkEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const submitBulkEntries = async () => {
    setIsSubmitting(true);

    try {
      // Validate all entries
      const invalidEntries = bulkEntries.filter(
        (entry) =>
          !entry.accountId ||
          !entry.amount ||
          !entry.description ||
          !entry.categoryId
      );

      if (invalidEntries.length > 0) {
        throw new Error(
          "All bulk entries must have account, amount, description, and category"
        );
      }

      // Create all transactions
      const createPromises = bulkEntries.map(async (entry) => {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entry),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to create bulk transaction"
          );
        }

        return response.json();
      });

      await Promise.all(createPromises);

      // Reset bulk state
      setBulkEntries([]);
      setShowBulkMode(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating bulk transactions:", error);
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to create bulk transactions",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: CreateTransactionRequest) => {
    setIsSubmitting(true);

    try {
      if (showSplitMode && splitEntries.length > 0) {
        // Handle split transaction
        if (Math.abs(getSplitDifference()) > 0.01) {
          throw new Error("Split amounts must equal the transaction total");
        }

        // Create multiple transactions for each split
        const splitPromises = splitEntries.map(async (entry) => {
          const splitData = {
            ...data,
            amount: data.amount.startsWith("-")
              ? `-${entry.amount}`
              : entry.amount,
            categoryId: entry.categoryId,
            description: entry.description || data.description,
          };

          const response = await fetch("/api/transactions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(splitData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Failed to create split transaction"
            );
          }

          return response.json();
        });

        await Promise.all(splitPromises);
      } else {
        // Handle regular transaction
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create transaction");
        }
      }

      // Reset form and state
      form.reset({
        accountId: "",
        amount: "",
        description: "",
        categoryId: "",
        transactionDate: new Date().toISOString(),
        receiptUrl: undefined,
      });
      setReceiptPreview(null);
      setShowSplitMode(false);
      setSplitEntries([]);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating transaction:", error);
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to create transaction",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedAmount = form.watch("amount");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const content = (
    <Form {...form}>
      {/* Quick Actions Section */}
      <div className={cn(
        "bg-muted/30 rounded-lg border",
        isModal ? "mb-4 p-4" : "mb-8 p-6"
      )}>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue("description", "Salary payment");
                form.setValue("amount", "");
                // Look for exact "Salary" match first, then fallback to contains logic
                const salaryCategory =
                  formData.categories.find(
                    (cat) => cat.name.toLowerCase() === "salary"
                  ) ||
                  formData.categories.find((cat) =>
                    cat.name.toLowerCase().includes("salary")
                  );
                if (salaryCategory)
                  form.setValue("categoryId", salaryCategory.id);
              }}
            >
              <Copy className="h-3 w-3 mr-1" />
              Salary
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue("description", "Grocery shopping");
                form.setValue("amount", "-");
                // Look for exact "Groceries" match first, then fallback to contains logic
                const groceryCategory =
                  formData.categories.find(
                    (cat) => cat.name.toLowerCase() === "groceries"
                  ) ||
                  formData.categories.find(
                    (cat) =>
                      cat.name.toLowerCase().includes("grocery") ||
                      cat.name.toLowerCase().includes("food")
                  );
                if (groceryCategory)
                  form.setValue("categoryId", groceryCategory.id);
              }}
            >
              <Copy className="h-3 w-3 mr-1" />
              Groceries
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSplitMode(!showSplitMode)}
            >
              <Split className="h-3 w-3 mr-1" />
              Split Transaction
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <BookOpen className="h-3 w-3 mr-1" />
              Templates
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBulkMode(!showBulkMode)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Bulk Entry
            </Button>
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            isModal ? "space-y-4" : "space-y-6 sm:space-y-8"
          )}
        >
          <div className={cn(
            "grid gap-4",
            isModal 
              ? "sm:grid-cols-2" 
              : "sm:gap-6 sm:grid-cols-2 xl:grid-cols-3"
          )}>
            <AccountSelectionField
              control={form.control}
              name="accountId"
              accounts={formData.accounts}
            />

            <AmountInputField
              control={form.control}
              name="amount"
              watchedAmount={watchedAmount}
            />

            <CategorySelectionField
              control={form.control}
              name="categoryId"
              categories={formData.categories}
              showSmartSuggestion={true}
              hasSuggestion={Boolean(
                watchedDescription &&
                suggestCategory(watchedDescription, formData.categories) &&
                !form.getValues("categoryId")
              )}
              description="Categories will be auto-suggested based on description."
            />

            <TransactionDateField
              control={form.control}
              name="transactionDate"
            />

            <div className={cn(isModal ? "col-span-2" : "sm:col-span-2 xl:col-span-1")}>
              <DescriptionField
                control={form.control}
                name="description"
                description="Add details about this transaction. Categories will be auto-suggested based on description."
              />
            </div>

            <div className={cn(isModal ? "col-span-2" : "sm:col-span-2 xl:col-span-1")}>
              <ReceiptUploadField
                control={form.control}
                name="receiptUrl"
                receiptPreview={receiptPreview}
                onReceiptUpload={handleReceiptUpload}
                onRemoveReceipt={removeReceipt}
              />
            </div>
          </div>

          {/* Split Transaction Mode */}
          {showSplitMode && (
            <div className={cn(
              "border-t",
              isModal ? "space-y-4 pt-4" : "space-y-6 pt-8"
            )}>
            <div className="flex items-center justify-between">
              <h3 className={cn(
                "font-medium",
                isModal ? "text-base" : "text-lg"
              )}>Split Transaction</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSplitMode(false);
                  setSplitEntries([]);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel Split
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Divide this transaction across multiple categories. The total of
              all splits should equal the transaction amount.
            </p>

            {/* Split Entries */}
            <div className={cn(isModal ? "space-y-3" : "space-y-4")}>
              {splitEntries.map((entry, index) => (
                <div
                  key={index}
                  className={cn(
                    "grid gap-2 items-end border rounded-lg",
                    isModal 
                      ? "grid-cols-1 sm:grid-cols-12 p-2" 
                      : "grid-cols-12 p-3"
                  )}
                >
                  <div className="col-span-5">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={entry.categoryId}
                      onValueChange={(value) =>
                        updateSplitEntry(index, "categoryId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor: `${category.color}20`,
                                }}
                              >
                                {category.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Amount</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        ₹
                      </span>
                      <Input
                        type="text"
                        placeholder="0.00"
                        className="pl-6"
                        value={entry.amount}
                        onChange={(e) =>
                          updateSplitEntry(index, "amount", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      type="text"
                      placeholder="Details"
                      value={entry.description}
                      onChange={(e) =>
                        updateSplitEntry(index, "description", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSplitEntry(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Add Split Entry Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSplitEntry}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Split
              </Button>
            </div>

            {/* Split Summary */}
            {splitEntries.length > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span>Total Split Amount:</span>
                  <span className="font-medium">₹{calculateSplitTotal()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Transaction Amount:</span>
                  <span className="font-medium">
                    ₹
                    {Math.abs(parseFloat(form.watch("amount")) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1 pt-1 border-t">
                  <span>Difference:</span>
                  <span
                    className={cn(
                      "font-medium",
                      getSplitDifference() === 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    ₹{Math.abs(getSplitDifference()).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transaction Templates */}
        {showTemplates && (
          <div className={cn(
            "border-t",
            isModal ? "space-y-4 pt-4" : "space-y-6 pt-8"
          )}>
            <div className="flex items-center justify-between">
              <h3 className={cn(
                "font-medium",
                isModal ? "text-base" : "text-lg"
              )}>Transaction Templates</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={saveAsTemplate}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Save as Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowTemplates(false);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Save frequently used transactions as templates for quick reuse.
            </p>

            {/* Template List */}
            <div className={cn(
              "grid gap-3",
              isModal ? "grid-cols-1" : "sm:grid-cols-2"
            )}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{template.name}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTemplate(template.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span>₹{template.amount}</span>
                    <span className="text-muted-foreground">
                      {
                        formData.categories.find(
                          (c) => c.id === template.categoryId
                        )?.name
                      }
                    </span>
                  </div>
                </div>
              ))}

              {templates.length === 0 && (
                <div className="col-span-2 text-center p-8 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <p>No templates saved yet</p>
                  <p className="text-sm">
                    Fill out the form and click &quot;Save as Template&quot; to
                    create your first template
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bulk Transaction Entry */}
        {showBulkMode && (
          <div className={cn(
            "border-t",
            isModal ? "space-y-4 pt-4" : "space-y-6 pt-8"
          )}>
            <div className="flex items-center justify-between">
              <h3 className={cn(
                "font-medium",
                isModal ? "text-base" : "text-lg"
              )}>Bulk Transaction Entry</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBulkEntry}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Entry
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowBulkMode(false);
                    setBulkEntries([]);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Add multiple transactions at once. Each entry will be created as a
              separate transaction.
            </p>

            {/* Bulk Entries */}
            <div className={cn(isModal ? "space-y-3" : "space-y-4")}>
              {bulkEntries.map((entry, index) => (
                <div
                  key={index}
                  className={cn(
                    "grid gap-2 items-end border rounded-lg",
                    isModal 
                      ? "grid-cols-1 sm:grid-cols-12 p-2" 
                      : "grid-cols-12 p-3"
                  )}
                >
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Account</label>
                    <Select
                      value={entry.accountId}
                      onValueChange={(value) =>
                        updateBulkEntry(index, "accountId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Amount</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        ₹
                      </span>
                      <Input
                        type="text"
                        placeholder="0.00"
                        className="pl-6"
                        value={entry.amount}
                        onChange={(e) =>
                          updateBulkEntry(index, "amount", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={entry.categoryId}
                      onValueChange={(value) =>
                        updateBulkEntry(index, "categoryId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor: `${category.color}20`,
                                }}
                              >
                                {category.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      type="text"
                      placeholder="Transaction details"
                      value={entry.description}
                      onChange={(e) =>
                        updateBulkEntry(index, "description", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBulkEntry(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {bulkEntries.length === 0 && (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Plus className="h-8 w-8 mx-auto mb-2" />
                  <p>No bulk entries yet</p>
                  <p className="text-sm">
                    Click &quot;Add Entry&quot; to start adding multiple
                    transactions
                  </p>
                </div>
              )}
            </div>

            {/* Bulk Actions */}
            {bulkEntries.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {bulkEntries.length} transaction
                  {bulkEntries.length !== 1 ? "s" : ""} ready
                </span>
                <Button
                  type="button"
                  onClick={submitBulkEntries}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create All Transactions
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {form.formState.errors.root && (
          <div className={cn(
            "text-sm text-destructive bg-destructive/10 rounded-md",
            isModal ? "p-2" : "p-3"
          )}>
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Form Actions */}
        <div className={cn(
          "flex gap-3 justify-end",
          isModal && "pt-2"
        )}>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </>
            )}
          </Button>
        </div>
      </form>
      </Form>
  );

  // If used in a modal, return content without Card wrapper
  if (isModal) {
    return content;
  }

  // Default standalone Card layout
  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Transaction
        </CardTitle>
        <CardDescription>
          Record a new income or expense transaction
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
