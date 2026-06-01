/**
 * @file responsive-modal.tsx
 * @description Modal that behaves like a centered Dialog on desktop and a
 * native-style full-height bottom Sheet on mobile.
 *
 * The Transactions add/edit dialogs were rendered as fixed-height `Dialog`s
 * with `overflow-visible` content. On a 360px-wide mobile PWA that caused
 * (a) the long form to overflow the viewport, (b) the action buttons to
 * sit below the keyboard, and (c) the title chrome to be hidden under the
 * close icon. This wrapper fixes all three by switching to a Radix `Sheet`
 * on mobile viewports while keeping the centered `Dialog` on `sm:`+ screens.
 *
 * The sticky footer ensures the primary action is always reachable above
 * the iOS virtual keyboard and Android system bars.
 */
"use client";

import * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Sticky footer rendered above the keyboard / safe area on mobile. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Optional className applied to the desktop dialog body. */
  desktopClassName?: string;
  /** Optional className applied to the mobile sheet body. */
  mobileClassName?: string;
  /** Hide the default close button (useful when footer has explicit cancel). */
  hideCloseButton?: boolean;
  /**
   * Called when the user presses the form's default submit action via
   * the footer. Useful when the footer lives outside the form element
   * (e.g. a Radix `DialogFooter`) and the primary button needs to call
   * `formRef.current?.requestSubmit()` to trigger react-hook-form.
   */
  onSubmitClick?: () => void;
}

/**
 * Returns true when the current viewport should render the mobile sheet.
 * Defaults to false during SSR to avoid layout mismatch flashes; the
 * useEffect flips it to the actual media-query value on the client.
 */
function useMobileViewport(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const handler = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  desktopClassName,
  mobileClassName,
  hideCloseButton = false,
  onSubmitClick,
}: ResponsiveModalProps) {
  const isMobile = useMobileViewport();

  // If the consumer supplied `onSubmitClick`, wrap the footer so its
  // primary submit button delegates to that handler. Otherwise we
  // render the footer as-is and let the form's own <button type="submit">
  // do the work (works when the footer is *inside* a <form>).
  const renderedFooter = React.useMemo(() => {
    if (!footer || !onSubmitClick) return footer;
    return (
      <FooterSubmitWrapper onSubmitClick={onSubmitClick}>
        {footer}
      </FooterSubmitWrapper>
    );
  }, [footer, onSubmitClick]);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={cn(
            "h-[100dvh] max-h-[100dvh] w-full gap-0 rounded-t-3xl border-t p-0",
            // Respect iPhone home-indicator safe area
            "pb-[env(safe-area-inset-bottom)]",
            mobileClassName,
          )}
        >
          {/* Drag handle — visual affordance for a bottom sheet on iOS/Android */}
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

          <SheetHeader className="border-b px-5 pb-4 pt-3 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SheetTitle className="truncate text-lg font-bold leading-tight">
                  {title}
                </SheetTitle>
                {description ? (
                  <SheetDescription className="mt-1 text-sm">
                    {description}
                  </SheetDescription>
                ) : null}
              </div>
              {!hideCloseButton ? (
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                  className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </SheetHeader>

          {/* Scrollable body — leaves room for the sticky footer */}
          <div
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain px-5 py-4",
              "min-h-0", // important for flex child to shrink inside sheet
            )}
          >
            {children}
          </div>

          {renderedFooter ? (
            <SheetFooter className="border-t bg-background px-5 py-3">
              {renderedFooter}
            </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Constrain height to the viewport; let the form scroll inside.
          "max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl",
          "rounded-2xl",
          desktopClassName,
        )}
        onOpenAutoFocus={(event) => {
          // Prevent the dialog from auto-scrolling the form to the top
          // on open, which can disorient the user.
          event.preventDefault();
        }}
      >
        <DialogHeader className="border-b px-6 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg font-bold leading-tight">
                {title}
              </DialogTitle>
              {description ? (
                <DialogDescription className="mt-1 text-sm">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
            {!hideCloseButton ? (
              <DialogClose
                className="-mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </DialogClose>
            ) : null}
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-7rem)] overflow-y-auto overscroll-contain px-6 py-4">
          {children}
        </div>

        {renderedFooter ? (
          <DialogFooter className="border-t bg-background px-6 py-3 sm:flex-row sm:justify-end sm:gap-2">
            {renderedFooter}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Pre-styled row of cancel / submit buttons for the modal footer.
 * Touch targets meet WCAG 2.5.5 (44×44 CSS px).
 */
interface ModalActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  submitIcon?: React.ReactNode;
  loadingLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
}

export function ModalActions({
  onCancel,
  isSubmitting,
  submitLabel,
  submitIcon,
  loadingLabel = "Saving...",
  cancelLabel = "Cancel",
  disabled = false,
}: ModalActionsProps) {
  return (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:h-10"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={isSubmitting || disabled}
        className="inline-flex h-12 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:h-10"
      >
        {submitIcon}
        {isSubmitting ? loadingLabel : submitLabel}
      </button>
    </div>
  );
}

/**
 * When `onSubmitClick` is supplied, the footer is rendered inside this
 * wrapper. The wrapper intercepts any `type="submit"` button click and
 * calls `onSubmitClick()` instead of the default form submission. This
 * lets the consumer use `<button type="submit">` for native Enter-key
 * form submission semantics while keeping the footer outside the form
 * element (which is necessary for a sticky footer in a Radix dialog).
 */
function FooterSubmitWrapper({
  children,
  onSubmitClick,
}: {
  children: React.ReactNode;
  onSubmitClick: () => void;
}) {
  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Enter" && !(event.target instanceof HTMLTextAreaElement)) {
          onSubmitClick();
        }
      }}
      // Delegate click events from any descendant <button type="submit">.
      onClickCapture={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('button[type="submit"]')) {
          event.preventDefault();
          onSubmitClick();
        }
      }}
    >
      {children}
    </div>
  );
}
