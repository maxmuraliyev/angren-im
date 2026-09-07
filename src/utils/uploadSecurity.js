/**
 * Shared file upload security utilities.
 * Used across ManageGallery, ManageNews, ManageTeachers, ManageStudents, ManageEvents, ManageStudentLife.
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov'];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB (Supabase default storage limit)

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

  const ext = file.name ? file.name.split('.').pop()?.toLowerCase() : '';
  const isVideo = file.type?.startsWith('video/') || ALLOWED_VIDEO_EXTENSIONS.includes(ext);

  if (isVideo) {
    // 1. Check video extension
    if (!ext || !ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Ruxsat etilmagan video kengaytmasi: .${ext}. Faqat: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`
      };
    }

    // 2. Check video MIME type if present
    if (file.type && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Ruxsat etilmagan video turi: ${file.type}. Faqat video fayllar qabul qilinadi.`
      };
    }

    // 3. Check video size
    if (file.size > MAX_VIDEO_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Video fayl hajmi juda katta (${sizeMB}MB). Maksimal hajm: 50MB.`
      };
    }

    return { valid: true, isVideo: true };
  } else {
    // Treat as image: require BOTH valid image extension AND valid image MIME type
    if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Ruxsat etilmagan rasm kengaytmasi: .${ext}. Faqat: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
      };
    }

    if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Ruxsat etilmagan rasm MIME formati (${file.type}). Faqat: ${ALLOWED_IMAGE_TYPES.join(', ')}`
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
 * Deep inspection of file magic bytes / signatures to prevent MIME spoofing.
 */
export async function checkFileSignature(file) {
  if (!file || !file.slice) return true;
  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4) return false;

    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
    // GIF: 47 49 46 38 ('GIF8')
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;
    // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      if (bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return true;
      }
    }
    // MP4 / QuickTime: bytes 4-7 are 'ftyp' (0x66, 0x74, 0x79, 0x70)
    if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      return true;
    }
    // WebM / MKV: 1A 45 DF A3
    if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
      return true;
    }
    // OGG: 4F 67 67 53 ('OggS')
    if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
      return true;
    }

    return false;
  } catch {
    return true; // Graceful fallback
  }
}

/**
 * Validates and sanitizes media URLs to prevent javascript: and dangerous URI schemes.
 */
export function sanitizeMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Strictly permit safe web protocols: https://, http://, or root-relative /
  if (/^(https?:\/\/|\/)/i.test(trimmed) && !trimmed.toLowerCase().startsWith('javascript:') && !trimmed.toLowerCase().startsWith('data:text')) {
    return trimmed;
  }
  return '';
}

/**
 * Generates a cryptographically secure, unique file name for any media file.
 */
export function generateSecureMediaFileName(originalName) {
  const ext = (originalName || '').split('.').pop()?.toLowerCase() || 'bin';
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
