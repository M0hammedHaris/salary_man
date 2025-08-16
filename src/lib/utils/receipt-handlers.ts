/**
 * Receipt handling utilities for transaction forms
 */

export interface ReceiptHandlers {
  handleReceiptUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeReceipt: () => void;
}

export function createReceiptHandlers(
  setReceiptPreview: (preview: string | null) => void,
  setReceiptUrl: (url: string | undefined) => void
): ReceiptHandlers {
  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, we'll just create a preview. In production, you'd upload to Vercel Blob
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setReceiptPreview(result);
        // In production, upload to Vercel Blob and set the URL
        setReceiptUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptPreview(null);
    setReceiptUrl(undefined);
  };

  return { handleReceiptUpload, removeReceipt };
}
