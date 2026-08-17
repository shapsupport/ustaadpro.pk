/**
 * Client-side image compression utility using HTML Canvas.
 * - Max width: 1024px
 * - Quality: 0.7 (70% JPEG quality)
 * - Max file size: 500KB
 * - Preserves image format (JPEG/PNG/WebP) when possible, converting PNGs to JPEG if needed to meet file size target.
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file is not an image."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1024;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2D context from canvas."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let mimeType = "image/jpeg";
        if (file.type === "image/webp") {
          mimeType = "image/webp";
        } else if (file.type === "image/png") {
          mimeType = "image/png";
        }

        let quality = 0.7;
        let dataUrl = canvas.toDataURL(mimeType, quality);

        const MAX_BYTES = 500 * 1024; // 500KB
        let approxBytes = getApproxByteSize(dataUrl);

        // PNG toDataURL ignores lossy quality setting. Convert to JPEG if size exceeds limit.
        if (mimeType === "image/png" && approxBytes > MAX_BYTES) {
          mimeType = "image/jpeg";
          dataUrl = canvas.toDataURL(mimeType, quality);
          approxBytes = getApproxByteSize(dataUrl);
        }

        // Iteratively reduce quality if still over 500KB limit
        while (approxBytes > MAX_BYTES && quality > 0.2) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL(mimeType, quality);
          approxBytes = getApproxByteSize(dataUrl);
        }

        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

function getApproxByteSize(dataUrl: string): number {
  const base64Str = dataUrl.split(",")[1] || "";
  return Math.round((base64Str.length * 3) / 4);
}
