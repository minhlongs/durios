export interface FileValidationResult {
  readonly isValid: boolean;
  readonly detectedMime: string;
  readonly error?: string;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateIncomingFile(
  buffer: Uint8Array,
  originalFilename: string
): FileValidationResult {
  if (buffer.length === 0) {
    return { isValid: false, detectedMime: "application/octet-stream", error: "File buffer is empty" };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      detectedMime: "application/octet-stream",
      error: `File size ${buffer.length} bytes exceeds 25MB statutory limit`,
    };
  }

  // Check magic bytes:
  // PDF: %PDF- (0x25, 0x50, 0x44, 0x46)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { isValid: true, detectedMime: "application/pdf" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { isValid: true, detectedMime: "image/png" };
  }

  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { isValid: true, detectedMime: "image/jpeg" };
  }

  // TIFF: II*. (49 49 2A 00) or MM.* (4D 4D 00 2A)
  if (
    buffer.length >= 4 &&
    ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
      (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a))
  ) {
    return { isValid: true, detectedMime: "image/tiff" };
  }

  // Reject executable or unauthorized files (e.g. MZ headers 0x4D 0x5A or shell scripts)
  return {
    isValid: false,
    detectedMime: "application/octet-stream",
    error: `Rejected malformed or unsupported file type for '${originalFilename}'. Supported formats: PDF, PNG, JPEG, TIFF.`,
  };
}
