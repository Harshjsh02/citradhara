/**
 * Direct Video Cloud Upload Helper
 * Enables community members and creators to upload video files directly from their browser
 * into Firebase Cloud Storage (5 GB Free Spark Tier), or custom webhook.
 */

import { storage, isFirebaseConfigured } from "./firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

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
 * Uploads a video file directly to Firebase Cloud Storage.
 * Includes CORS and preflight timeout detection so users aren't left frozen.
 */
export async function uploadVideoFileToDrive(
  file: File,
  onProgress?: (progress: DriveUploadProgress) => void
): Promise<DriveUploadResponse> {
  // Option 1: Firebase Cloud Storage Direct Upload (Real Cloud Storage)
  if (isFirebaseConfigured && storage) {
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `videos/${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return await new Promise<DriveUploadResponse>((resolve) => {
        let hasTransferred = false;

        // If after 4.5 seconds 0 bytes transferred due to CORS preflight failure, notify user immediately
        const timeoutId = setTimeout(() => {
          if (!hasTransferred) {
            try {
              uploadTask.cancel();
            } catch {}
            resolve({
              success: false,
              error:
                "Direct browser upload blocked by Cloud Storage CORS. Please use the 'Paste Video Link' tab to stream directly from Google Drive or YouTube (100% free with unlimited streaming).",
            });
          }
        }, 4500);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            if (snapshot.bytesTransferred > 0) {
              hasTransferred = true;
            }
            const percentage = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            if (onProgress) {
              onProgress({
                loaded: snapshot.bytesTransferred,
                total: snapshot.totalBytes,
                percentage,
              });
            }
          },
          (error) => {
            clearTimeout(timeoutId);
            console.warn("Firebase Storage upload error:", error);
            resolve({
              success: false,
              error:
                "Firebase Storage CORS blocked the upload. Please use the 'Paste Video Link' tab to stream directly from Google Drive or YouTube.",
            });
          },
          async () => {
            clearTimeout(timeoutId);
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                success: true,
                fileId: downloadUrl,
                url: downloadUrl,
              });
            } catch (err) {
              resolve({
                success: false,
                error: "Failed retrieving permanent streaming URL from cloud storage.",
              });
            }
          }
        );
      });
    } catch (err: any) {
      console.warn("Direct upload error:", err);
      return {
        success: false,
        error: err.message || "Failed initializing cloud upload.",
      };
    }
  }

  // Option 2: Google Drive Webhook if configured
  const webhookUrl = process.env.NEXT_PUBLIC_DRIVE_UPLOAD_WEBHOOK;
  if (webhookUrl && webhookUrl.startsWith("http")) {
    try {
      const base64Data = await readFileAsBase64(file, onProgress);
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      }
    } catch (err: any) {
      console.warn("Drive webhook error:", err);
    }
  }

  return {
    success: false,
    error: "Direct storage endpoint not connected. Please paste your Google Drive or YouTube link to stream.",
  };
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
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
