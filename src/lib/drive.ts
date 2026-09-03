/**
 * Google Drive URL Parser & Video Stream Helper
 * Converts any Google Drive share link into an embedded preview player URL & high-res thumbnail URL.
 */

export function extractDriveFileId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view or preview
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Pattern 2: https://drive.google.com/open?id={FILE_ID} or /uc?id={FILE_ID}
  const idQueryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch && idQueryMatch[1]) {
    return idQueryMatch[1];
  }

  // Pattern 3: Raw File ID (standard Google Drive IDs are 25-45 alphanumeric characters with underscores/dashes)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function getDriveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getDriveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function getDriveThumbnailUrl(fileId: string): string {
  // Uses Google's CDN high-res thumbnail generator for drive files
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1280`;
}

export function validateDriveUrl(url: string): { valid: boolean; fileId: string | null; error?: string } {
  const fileId = extractDriveFileId(url);
  if (!fileId) {
    return {
      valid: false,
      fileId: null,
      error: 'Invalid Google Drive link. Please paste a link like https://drive.google.com/file/d/.../view or the file ID.'
    };
  }
  return {
    valid: true,
    fileId
  };
}
