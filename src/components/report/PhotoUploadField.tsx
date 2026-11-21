"use client";

import { Camera, Trash2 } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent, RefObject } from "react";

interface PhotoUploadFieldProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  photoFile: File | null;
  photoPreviewUrl: string | null;
  photoError: string | null;
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
}

export function PhotoUploadField({
  fileInputRef,
  photoFile,
  photoPreviewUrl,
  photoError,
  onPhotoChange,
  onRemovePhoto,
}: PhotoUploadFieldProps) {
  return (
    <div className="space-y-2.5">
      <label
        htmlFor="issue-photo"
        className="block text-sm font-semibold text-[#0F172A]"
      >
        Photo Evidence (Optional — 1 photo up to 5 MB)
      </label>
      <div className="rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 text-center transition-colors hover:border-[#0369A1]">
        <Camera
          className="mx-auto h-7 w-7 text-[#0369A1]"
          aria-hidden="true"
        />
        <p className="mt-2 text-sm font-semibold text-[#0F172A]">
          Attach field photo for Gemini multimodal triage
        </p>
        <p className="mt-0.5 text-xs text-[#475569]">
          Maximum 1 photo up to 5 MB (JPEG, PNG, or WebP)
        </p>
        <input
          ref={fileInputRef}
          id="issue-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPhotoChange}
          aria-describedby="photo-upload-error"
          className="mt-3 block w-full cursor-pointer text-xs text-[#475569] file:mr-3 file:rounded-lg file:border file:border-[#CBD5E1] file:bg-white file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-[#1B365D] hover:file:bg-[#EFF6FF]"
        />
      </div>

      {photoError && (
        <p
          id="photo-upload-error"
          role="alert"
          className="text-xs font-semibold text-[#991B1B]"
        >
          {photoError}
        </p>
      )}

      {photoFile && photoPreviewUrl && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#CBD5E1] bg-white p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F1F5F9]">
              <Image
                src={photoPreviewUrl}
                alt={`Preview of ${photoFile.name}`}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[#0F172A]">
                {photoFile.name}
              </p>
              <p className="text-[11px] text-[#475569]">
                {(photoFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for
                Gemini Vision
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemovePhoto}
            aria-label="Remove attached photo"
            className="rounded-lg p-2 text-[#475569] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
