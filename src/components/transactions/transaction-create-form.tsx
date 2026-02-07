"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Zap,
  Split,
  Copy,
  BookOpen,
  X,
  Loader2,
  Plus,
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

  const watchedDescription = form.watch("description");

  const { handleReceiptUpload, removeReceipt }: ReceiptHandlers = createReceiptHandlers(
    setReceiptPreview,
    (url) => form.setValue('receiptUrl', url)
  );

  // Auto-suggest category
  useEffect(() => {
    if (watchedDescription && watchedDescription.length >= 3) {
      const currentCategoryId = form.getValues("categoryId");
      if (!currentCategoryId) {
        const suggestedCategoryId = suggestCategory(watchedDescription, formData.categories);
        if (suggestedCategoryId) {
          setTimeout(() => {
            form.setValue("categoryId", suggestedCategoryId);
          }, 500);
        }
      }
    }
  }, [watchedDescription, form, formData.categories]);

  useEffect(() => {
    const savedTemplates = localStorage.getItem("transactionTemplates");
    setTemplates(savedTemplates ? JSON.parse(savedTemplates) : []);
  }, []);

  const addSplitEntry = () => setSplitEntries(p => [...p, { categoryId: "", amount: "", description: "" }]);
  const removeSplitEntry = (index: number) => setSplitEntries(p => p.filter((_, i) => i !== index));
  const updateSplitEntry = (index: number, field: keyof SplitEntry, value: string) => {
    setSplitEntries(p => p.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const calculateSplitTotal = () => splitEntries.reduce((t, e) => t + (parseFloat(e.amount) || 0), 0).toFixed(2);
  const getSplitDifference = () => {
    const transactionAmount = Math.abs(parseFloat(form.watch("amount")) || 0);
    return parseFloat(calculateSplitTotal()) - transactionAmount;
  };

  const saveAsTemplate = () => {
    const v = form.getValues();
    if (!v.description || !v.amount || !v.categoryId) return;
    const name = prompt("Enter template name:");
    if (!name) return;
    const newT = { id: Date.now().toString(), name, amount: Math.abs(parseFloat(v.amount)).toString(), description: v.description, categoryId: v.categoryId, accountId: v.accountId };
    const updated = [...templates, newT];
    setTemplates(updated);
    localStorage.setItem("transactionTemplates", JSON.stringify(updated));
  };

  const applyTemplate = (t: TransactionTemplate) => {
    form.setValue("description", t.description);
    form.setValue("amount", t.amount);
    form.setValue("categoryId", t.categoryId);
    if (t.accountId) form.setValue("accountId", t.accountId);
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem("transactionTemplates", JSON.stringify(updated));
  };

  const addBulkEntry = () => setBulkEntries(p => [...p, { accountId: "", amount: "", description: "", categoryId: "", transactionDate: new Date().toISOString() }]);
  const removeBulkEntry = (idx: number) => setBulkEntries(p => p.filter((_, i) => i !== idx));
  const updateBulkEntry = (idx: number, f: keyof CreateTransactionRequest, v: string) => {
    setBulkEntries(p => p.map((e, i) => i === idx ? { ...e, [f]: v } : e));
  };

  const submitBulkEntries = async () => {
    setIsSubmitting(true);
    try {
      if (bulkEntries.some(e => !e.accountId || !e.amount || !e.description || !e.categoryId)) {
        throw new Error("All entries must be complete");
      }
      await Promise.all(bulkEntries.map(e => fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(e) })));
      setBulkEntries([]);
      setShowBulkMode(false);
      onSuccess?.();
    } catch (e) {
      form.setError("root", { message: e instanceof Error ? e.message : "Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: CreateTransactionRequest) => {
    setIsSubmitting(true);
    try {
      if (showSplitMode && splitEntries.length > 0) {
        if (Math.abs(getSplitDifference()) > 0.01) throw new Error("Splits must equal total");
        await Promise.all(splitEntries.map(e => fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, amount: data.amount.startsWith("-") ? `-${e.amount}` : e.amount, categoryId: e.categoryId, description: e.description || data.description })
        })));
      } else {
        await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      }
      form.reset();
      setReceiptPreview(null);
      setShowSplitMode(false);
      setSplitEntries([]);
      onSuccess?.();
    } catch (e) {
      form.setError("root", { message: e instanceof Error ? e.message : "Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedAmount = form.watch("amount");

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const mainForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <AmountInputField control={form.control} name="amount" watchedAmount={watchedAmount} />
            <AccountSelectionField control={form.control} name="accountId" accounts={formData.accounts} />
            <CategorySelectionField
              control={form.control}
              name="categoryId"
              categories={formData.categories}
              showSmartSuggestion={true}
              hasSuggestion={!!(watchedDescription && suggestCategory(watchedDescription, formData.categories))}
            />
          </div>
          <div className="space-y-8">
            <TransactionDateField control={form.control} name="transactionDate" />
            <DescriptionField control={form.control} name="description" />
            <ReceiptUploadField
              control={form.control}
              name="receiptUrl"
              receiptPreview={receiptPreview}
              onReceiptUpload={handleReceiptUpload}
              onRemoveReceipt={removeReceipt}
            />
          </div>
        </div>

        {showSplitMode && (
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">Split Details</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowSplitMode(false); setSplitEntries([]); }} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold">Cancel Split</Button>
            </div>
            <div className="space-y-4">
              {splitEntries.map((entry, index) => (
                <div key={index} className="flex gap-4 items-end bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Category</label>
                    <Select value={entry.categoryId} onValueChange={(v) => updateSplitEntry(index, "categoryId", v)}>
                      <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-950 border-slate-200">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        {formData.categories.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <Input type="text" placeholder="0.00" className="h-12 pl-7 rounded-xl bg-white dark:bg-slate-950 border-slate-200 font-bold" value={entry.amount} onChange={(e) => updateSplitEntry(index, "amount", e.target.value)} />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSplitEntry(index)} className="h-12 w-12 rounded-xl text-rose-500 hover:bg-rose-50"><X className="h-5 w-5" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSplitEntry} className="w-full h-12 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-all font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Add Split Row</Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-4">
            <Button type="button" variant="ghost" onClick={saveAsTemplate} className="rounded-xl px-4 py-6 h-auto font-bold text-slate-500 flex items-center gap-2 hover:bg-slate-100 transition-all"><span className="material-symbols-outlined">bookmark</span> Save as Template</Button>
            <Button type="button" variant="ghost" onClick={() => setShowSplitMode(!showSplitMode)} className={cn("rounded-xl px-4 py-6 h-auto font-bold transition-all flex items-center gap-2", showSplitMode ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100")}><span className="material-symbols-outlined">splitscreen</span> {showSplitMode ? "Cancel Split" : "Split Transaction"}</Button>
          </div>
          <div className="flex items-center justify-end gap-4 min-h-[80px]">
            {onCancel && <Button type="button" variant="ghost" onClick={onCancel} className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-muted-foreground">Cancel</Button>}
            <Button id="submit-transaction" type="submit" disabled={isSubmitting} className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all flex items-center gap-2 min-w-[200px]">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="material-symbols-outlined">send</span>}
              <span>{isSubmitting ? "Processing..." : "Complete"}</span>
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );

  return (
    <Card className={cn("border-none shadow-2xl overflow-hidden rounded-[40px] bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xl", !isModal && "max-w-4xl mx-auto")}>
      <CardHeader className="bg-white dark:bg-slate-900 pb-8 pt-10 px-8 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1.5">
            <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-3xl">add_shopping_cart</span></div>
              Add Transaction
            </CardTitle>
            <CardDescription className="text-base font-medium text-slate-500 ml-15">Track your spending and income with precision</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isModal && <Button variant="ghost" onClick={onCancel} className="rounded-2xl w-12 h-12 hover:bg-slate-100 transition-all"><X className="w-6 h-6" /></Button>}
            <Button variant="outline" onClick={() => setShowTemplates(!showTemplates)} className={cn("rounded-2xl w-12 h-12 border-slate-200 transition-all", showTemplates ? "bg-primary text-white" : "hover:bg-slate-100")}><BookOpen className="w-5 h-5" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-10">
        {showTemplates && templates.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 ml-1">Quick Templates</h3>
            <div className="flex flex-wrap gap-3">
              {templates.map((t) => (
                <div key={t.id} className="group relative">
                  <Button variant="outline" onClick={() => applyTemplate(t)} className="h-auto py-3 px-5 rounded-2xl border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-all text-left flex flex-col items-start gap-1">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">{t.name}<span className="material-symbols-outlined text-[14px]">magic_button</span></span>
                    <span className="text-xs text-muted-foreground font-black uppercase tracking-wider">{t.description}</span>
                  </Button>
                  <button onClick={() => deleteTemplate(t.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg transition-opacity"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        {mainForm}
      </CardContent>
    </Card>
  );
}
