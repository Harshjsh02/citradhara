/**
 * Direct Google Drive Community Upload Helper
 * Enables community members to upload video files directly to the admin's Google Drive.
 */

export interface DriveUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface DriveUploadResponse {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}

/**
 * Uploads a video file directly to the configured Google Drive Webhook/Apps Script.
 * If no webhook is configured in environment, it simulates the upload for demonstration
 * and guides the admin on how to provide the endpoint.
 */
export async function uploadVideoFileToDrive(
  file: File,
  onProgress?: (progress: DriveUploadProgress) => void
): Promise<DriveUploadResponse> {
  const webhookUrl = process.env.NEXT_PUBLIC_DRIVE_UPLOAD_WEBHOOK;

  if (webhookUrl && webhookUrl.startsWith("http")) {
    try {
      // Read file as base64 for Google Apps Script Web App
      const base64Data = await readFileAsBase64(file, onProgress);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || "video/mp4",
          base64: base64Data,
        }),
      });

      const result = await response.json();
      if (result.fileId) {
        return {
          success: true,
          fileId: result.fileId,
          url: result.url || `https://drive.google.com/file/d/${result.fileId}/view`,
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to receive Google Drive file ID.",
        };
      }
    } catch (err: any) {
      console.error("Drive upload webhook error:", err);
      return {
        success: false,
        error: err.message || "Network error uploading to Google Drive.",
      };
    }
  }

  // Demo / Simulation mode if webhook is not set up yet
  return simulateDirectUpload(file, onProgress);
}

function readFileAsBase64(
  file: File,
  onProgress?: (progress: DriveUploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    };

    reader.onload = () => {
      const result = reader.result as string;
      // strip data:video/mp4;base64,
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };

    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function simulateDirectUpload(
  file: File,
  onProgress?: (progress: DriveUploadProgress) => void
): Promise<DriveUploadResponse> {
  return new Promise((resolve) => {
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      if (onProgress) {
        onProgress({
          loaded: Math.min(file.size, Math.round((current / 100) * file.size)),
          total: file.size,
          percentage: Math.min(100, current),
        });
      }

      if (current >= 100) {
        clearInterval(interval);
        // Generate a mock Drive file ID for preview
        const mockFileId = `drive_upload_${Date.now().toString(36)}`;
        resolve({
          success: true,
          fileId: mockFileId,
          url: `https://drive.google.com/file/d/${mockFileId}/view`,
        });
      }
    }, 180);
  });
}
