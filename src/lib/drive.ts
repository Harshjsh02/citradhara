/**
 * Video URL Parser & Stream Helper (Google Drive + YouTube + Direct Cloud)
 * Converts any Google Drive or YouTube share link into embedded player URLs and thumbnails.
 */

export const DEFAULT_COMMUNITY_FOLDER_ID = process.env.NEXT_PUBLIC_DRIVE_FOLDER_ID || "1-zNgIZjpaLi49KnegN-cdFH6y2QmJ0ec";
export const DEFAULT_COMMUNITY_FOLDER_URL = process.env.NEXT_PUBLIC_DRIVE_FOLDER_URL || "https://drive.google.com/drive/folders/1-zNgIZjpaLi49KnegN-cdFH6y2QmJ0ec?usp=sharing";

export interface VideoSourceDetails {
  source: "drive" | "youtube" | "direct";
  id: string;
  embedUrl: string;
  thumbnailUrl: string;
  viewUrl: string;
}

/**
 * Extracts the video ID or file ID from either Google Drive, YouTube, or raw IDs.
 */
export function extractDriveFileId(input: string): string | null {
  const details = parseVideoUrl(input);
  return details ? details.id : null;
}

export function parseVideoUrl(input: string): VideoSourceDetails | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pattern 1: YouTube URLs
  // Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    return {
      source: "youtube",
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      viewUrl: `https://www.youtube.com/watch?v=${id}`
    };
  }

  // Pattern 1b: Raw 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return {
      source: "youtube",
      id: trimmed,
      embedUrl: `https://www.youtube-nocookie.com/embed/${trimmed}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${trimmed}/hqdefault.jpg`,
      viewUrl: `https://www.youtube.com/watch?v=${trimmed}`
    };
  }

  // Pattern 2: Google Drive /file/d/ or /file/u/0/d/
  const fileDMatch = trimmed.match(/\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    const id = fileDMatch[1];
    return {
      source: "drive",
      id,
      embedUrl: `https://drive.google.com/file/d/${id}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w1280`,
      viewUrl: `https://drive.google.com/file/d/${id}/view`
    };
  }

  // Pattern 3: Google Drive ?id= or uc?id=
  const idQueryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch && idQueryMatch[1]) {
    const id = idQueryMatch[1];
    return {
      source: "drive",
      id,
      embedUrl: `https://drive.google.com/file/d/${id}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w1280`,
      viewUrl: `https://drive.google.com/file/d/${id}/view`
    };
  }

  // Pattern 4: Raw File ID (standard Google Drive IDs are 25-45 alphanumeric characters with underscores/dashes)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return {
      source: "drive",
      id: trimmed,
      embedUrl: `https://drive.google.com/file/d/${trimmed}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${trimmed}&sz=w1280`,
      viewUrl: `https://drive.google.com/file/d/${trimmed}/view`
    };
  }

  // Pattern 5: Direct media link (mp4, webm, blob, firebase storage)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("blob:")) {
    return {
      source: "direct",
      id: trimmed,
      embedUrl: trimmed,
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80",
      viewUrl: trimmed
    };
  }

  return null;
}

export function getDriveEmbedUrl(fileIdOrUrl: string): string {
  const details = parseVideoUrl(fileIdOrUrl);
  if (details) return details.embedUrl;
  return `https://drive.google.com/file/d/${fileIdOrUrl}/preview`;
}

export function getDriveViewUrl(fileIdOrUrl: string): string {
  const details = parseVideoUrl(fileIdOrUrl);
  if (details) return details.viewUrl;
  return `https://drive.google.com/file/d/${fileIdOrUrl}/view`;
}

export function getDriveThumbnailUrl(fileIdOrUrl: string): string {
  const details = parseVideoUrl(fileIdOrUrl);
  if (details) return details.thumbnailUrl;
  return `https://drive.google.com/thumbnail?id=${fileIdOrUrl}&sz=w1280`;
}

export function normalizeThumbnailUrl(urlOrId: string): string {
  if (!urlOrId) return "";
  const trimmed = urlOrId.trim();

  // If it's a base64 data URL from video frame capture
  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  // Check for Google Drive file link (e.g. drive.google.com/file/d/1GHC3q5CNdtrOYL1-05zOQXOU-u9FClyf/view)
  const driveIdMatch =
    trimmed.match(/\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${driveIdMatch[1]}&sz=w1280`;
  }

  // Check for YouTube link
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // If it's a raw Drive ID
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return `https://drive.google.com/thumbnail?id=${trimmed}&sz=w1280`;
  }

  return trimmed;
}

export function validateDriveUrl(url: string): { valid: boolean; fileId: string | null; error?: string } {
  const details = parseVideoUrl(url);
  if (!details) {
    return {
      valid: false,
      fileId: null,
      error: 'Please paste a valid Google Drive share link (e.g. drive.google.com/file/d/...) or a YouTube link.'
    };
  }
  return {
    valid: true,
    fileId: details.id
  };
}
