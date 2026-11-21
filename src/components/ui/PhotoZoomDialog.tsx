"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Image from "next/image";
import { isInlineOrSvgUrl } from "@/lib/utils/formatters";

export interface ZoomPhotoPayload {
  src: string;
  label: string;
  alt: string;
  description?: string;
}

interface PhotoZoomDialogProps {
  photo: ZoomPhotoPayload | null;
  onClose: () => void;
  closeAriaLabel?: string;
}

/**
 * Shared accessible photo zoom lightbox backed by Radix Dialog.
 */
export function PhotoZoomDialog({
  photo,
  onClose,
  closeAriaLabel = "Close zoomed photo",
}: PhotoZoomDialogProps) {
  return (
    <Dialog.Root
      open={photo !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#CBD5E1] bg-white p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3 pb-3">
            <Dialog.Title className="font-headline text-sm font-bold text-[#0F172A]">
              {photo?.label}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={closeAriaLabel}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          {photo && (
            <>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#0F172A]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  unoptimized={isInlineOrSvgUrl(photo.src)}
                  sizes="94vw"
                  className="object-contain"
                />
              </div>
              {photo.description && (
                <Dialog.Description className="mt-2.5 text-xs text-[#475569]">
                  {photo.description}
                </Dialog.Description>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
