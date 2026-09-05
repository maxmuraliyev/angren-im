/**
 * Shared file upload security utilities.
 * Used across ManageGallery, ManageTeachers, ManageStudents, ManageEvents.
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validates an uploaded file for type, extension, and size.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: "Fayl tanlanmagan." };
  }

  // 1. Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Faqat rasm fayllari qabul qilinadi (JPG, PNG, GIF, WebP). Sizning fayl turi: ${file.type || 'noma\'lum'}`
    };
  }

  // 2. Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Ruxsat etilmagan fayl kengaytmasi: .${ext}. Faqat: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
    };
  }

  // 3. Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Fayl hajmi juda katta (${sizeMB}MB). Maksimal hajm: 5MB.`
    };
  }

  return { valid: true };
}

/**
 * Generates a cryptographically secure, unique file name.
 * Uses crypto.randomUUID() instead of Math.random().
 */
export function generateSecureFileName(originalName) {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  // Whitelist the extension one more time
  const safeExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext) ? ext : 'jpg';
  return `${crypto.randomUUID()}.${safeExt}`;
}
