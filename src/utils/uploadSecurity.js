/**
 * Shared file upload security utilities.
 * Used across ManageGallery, ManageNews, ManageTeachers, ManageStudents, ManageEvents.
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov'];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB (Supabase default free storage limit)

/**
 * Checks whether a given File object, MIME type string, or URL is a video.
 */
export function isVideoMedia(fileOrUrl) {
  if (!fileOrUrl) return false;
  if (typeof fileOrUrl === 'object' && fileOrUrl.type) {
    return fileOrUrl.type.startsWith('video/') || ALLOWED_VIDEO_TYPES.includes(fileOrUrl.type);
  }
  const str = String(fileOrUrl).toLowerCase().split('?')[0];
  return ALLOWED_VIDEO_EXTENSIONS.some(ext => str.endsWith(`.${ext}`));
}

/**
 * Validates an uploaded media file (image OR video).
 * Returns { valid: true, isVideo: boolean } or { valid: false, error: string }.
 */
export function validateMediaFile(file) {
  if (!file) {
    return { valid: false, error: "Fayl tanlanmagan." };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  const isVideo = file.type?.startsWith('video/') || ALLOWED_VIDEO_EXTENSIONS.includes(ext);

  if (isVideo) {
    // 1. Check video extension & MIME
    if (!ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Ruxsat etilmagan video formati: .${ext}. Faqat: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`
      };
    }

    // 2. Check video size
    if (file.size > MAX_VIDEO_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Video fayl hajmi juda katta (${sizeMB}MB). Maksimal hajm: 50MB.`
      };
    }

    return { valid: true, isVideo: true };
  } else {
    // Treat as image
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Faqat rasm (JPG, PNG, GIF, WebP) yoki video (MP4, WebM, OGG, MOV) qabul qilinadi.`
      };
    }

    if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Ruxsat etilmagan rasm kengaytmasi: .${ext}. Faqat: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
      };
    }

    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Rasm hajmi juda katta (${sizeMB}MB). Maksimal hajm: 10MB.`
      };
    }

    return { valid: true, isVideo: false };
  }
}

/**
 * Generates a cryptographically secure, unique file name for any media file.
 */
export function generateSecureMediaFileName(originalName) {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
  const allAllowed = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS];
  const safeExt = allAllowed.includes(ext) ? ext : 'bin';
  return `${crypto.randomUUID()}.${safeExt}`;
}

/**
 * Legacy image validator for backward compatibility.
 */
export function validateImageFile(file) {
  return validateMediaFile(file);
}

export function generateSecureFileName(originalName) {
  return generateSecureMediaFileName(originalName);
}
