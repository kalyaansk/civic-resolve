/**
 * Server- and client-safe image validation enforcing max 1 photo, <= 5 MB,
 * strict MIME allowlist (JPEG, PNG, WebP), and magic-byte header inspection.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export interface ImageValidationSuccess {
  valid: true;
  mimeType: AllowedImageMimeType;
  extension: "jpg" | "png" | "webp";
  bytes: Uint8Array;
}

export interface ImageValidationFailure {
  valid: false;
  error: string;
}

export type ImageValidationResult =
  | ImageValidationSuccess
  | ImageValidationFailure;

function isAllowedMime(mime: string): mime is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

/**
 * Detects the actual image format from file magic bytes (first 12 bytes).
 */
export function detectImageMimeFromMagicBytes(
  bytes: Uint8Array,
): AllowedImageMimeType | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: "RIFF" .... "WEBP"
  const isRiff =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46;
  const isWebp =
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  if (isRiff && isWebp) {
    return "image/webp";
  }

  return null;
}

function extensionForMime(mime: AllowedImageMimeType): "jpg" | "png" | "webp" {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

/**
 * Validates raw uploaded image bytes and claimed MIME type against 5 MB limit
 * and magic-byte signatures.
 */
export function validateImageBytes(
  bytes: Uint8Array,
  claimedMimeType?: string,
): ImageValidationResult {
  if (bytes.byteLength === 0) {
    return { valid: false, error: "Uploaded photo file is empty." };
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: "Photo exceeds the 5 MB maximum file size limit.",
    };
  }
  if (claimedMimeType && !isAllowedMime(claimedMimeType)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, and WebP images are supported.",
    };
  }

  const detectedMime = detectImageMimeFromMagicBytes(bytes);
  if (!detectedMime) {
    return {
      valid: false,
      error:
        "Invalid image signature. Please upload a genuine JPEG, PNG, or WebP file.",
    };
  }

  if (claimedMimeType && claimedMimeType !== detectedMime) {
    return {
      valid: false,
      error:
        "File contents do not match the declared image format. Please upload a valid JPEG, PNG, or WebP photo.",
    };
  }

  return {
    valid: true,
    mimeType: detectedMime,
    extension: extensionForMime(detectedMime),
    bytes,
  };
}

/**
 * Validates an uploaded `File` / `Blob` from FormData on the server.
 */
export async function validateUploadedPhoto(
  file: File,
): Promise<ImageValidationResult> {
  if (file.size === 0) {
    return { valid: false, error: "Uploaded photo file is empty." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: "Photo exceeds the 5 MB maximum file size limit.",
    };
  }
  if (file.type && !isAllowedMime(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, and WebP images are supported.",
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  return validateImageBytes(bytes, file.type || undefined);
}
