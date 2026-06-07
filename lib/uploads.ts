/**
 * uploadToR2 — PUT a File directly to a Cloudflare R2 presigned URL.
 *
 * Uses XMLHttpRequest rather than fetch so we can report upload progress
 * (the Fetch API does not expose upload progress events).
 */
export async function uploadToR2(
  file: File,
  uploadUrl: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      // R2 presigned PUT returns 200 on success.
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`R2 upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("R2 upload failed — network error")),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("R2 upload was aborted")),
    );

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
