export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  size: number;
}

export interface ImageProcessingOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  withWatermark?: boolean;
  watermarkOpacity?: number;
}

const WATERMARK_TEXT = "Andrea Fontes";

function createWatermarkPattern(ctx: CanvasRenderingContext2D, opacity: number): CanvasPattern | null {
  const patternCanvas = document.createElement("canvas");
  const patternCtx = patternCanvas.getContext("2d");
  if (!patternCtx) return null;

  patternCanvas.width = 300;
  patternCanvas.height = 300;

  patternCtx.translate(150, 150);
  patternCtx.rotate((-45 * Math.PI) / 180);
  patternCtx.font = "bold 24px Helvetica, Arial, sans-serif";
  patternCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  patternCtx.textAlign = "center";
  patternCtx.textBaseline = "middle";
  patternCtx.fillText(WATERMARK_TEXT, 0, 0);

  return ctx.createPattern(patternCanvas, "repeat");
}

export async function processImage(
  file: File,
  options: ImageProcessingOptions
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > options.maxWidth || height > options.maxHeight) {
        const ratio = Math.min(
          options.maxWidth / width,
          options.maxHeight / height
        );
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2d context"));
        return;
      }

      // Draw original image (this automatically strips EXIF data)
      ctx.drawImage(img, 0, 0, width, height);

      // Apply watermark if requested
      if (options.withWatermark) {
        const pattern = createWatermarkPattern(ctx, options.watermarkOpacity || 0.1);
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // Try webp first, fallback to jpeg
      let mimeType = "image/webp";
      let quality = options.quality;
      
      // Some old Safari versions don't support webp encoding
      const testCanvas = document.createElement("canvas");
      testCanvas.width = 1;
      testCanvas.height = 1;
      if (testCanvas.toDataURL("image/webp").indexOf("data:image/webp") !== 0) {
        mimeType = "image/jpeg";
      }

      canvas.toBlob(
        (blob) => {
          // Cleanup
          canvas.width = 0;
          canvas.height = 0;

          if (!blob) {
            reject(new Error("Canvas to Blob failed"));
            return;
          }
          resolve({
            blob,
            width,
            height,
            size: blob.size,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}
