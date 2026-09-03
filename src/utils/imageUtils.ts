/**
 * Utility functions for client-side image processing.
 * Specializes in automatic background removal for hotel logos,
 * converting images with solid black or white backgrounds into clean transparent PNGs.
 */

export interface BackgroundRemovalOptions {
  /** Force removal of black background even if heuristic is uncertain */
  forceBlack?: boolean;
  /** Max brightness (0-255) considered pure black background */
  blackCutoff?: number;
  /** Brightness threshold where foreground pixels become 100% solid */
  solidThreshold?: number;
  /** Max dimensions to scale down for performance/storage */
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Removes solid black or near-black background from an image
 * and returns a crisp, transparent PNG data URL.
 * Automatically cleans dark edge fringes to keep gold emblems vibrant.
 */
export async function removeBlackBackground(
  imageSource: string | File | Blob,
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  const {
    forceBlack = false,
    blackCutoff = 38,
    solidThreshold = 85,
    maxWidth = 1000,
    maxHeight = 1000,
  } = options;

  let srcUrl = '';
  let shouldRevoke = false;

  if (typeof imageSource === 'string') {
    srcUrl = imageSource;
  } else if (imageSource instanceof Blob) {
    srcUrl = URL.createObjectURL(imageSource);
    shouldRevoke = true;
  }

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Scale down if oversized while preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          if (shouldRevoke) URL.revokeObjectURL(srcUrl);
          resolve(typeof imageSource === 'string' ? imageSource : canvas.toDataURL('image/png'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // 1. Analyze border pixels to detect background nature
        let darkBorderPixels = 0;
        let lightBorderPixels = 0;
        let transparentBorderPixels = 0;
        let totalSampled = 0;

        const samplePixel = (x: number, y: number) => {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          totalSampled++;
          if (a < 20) {
            transparentBorderPixels++;
          } else {
            const brightness = Math.max(r, g, b);
            if (brightness <= 45) {
              darkBorderPixels++;
            } else if (r > 215 && g > 215 && b > 215) {
              lightBorderPixels++;
            }
          }
        };

        // Sample outer perimeters (top, bottom, left, right borders)
        const stepX = Math.max(1, Math.floor(width / 40));
        const stepY = Math.max(1, Math.floor(height / 40));

        for (let x = 0; x < width; x += stepX) {
          samplePixel(x, 0);
          samplePixel(x, height - 1);
        }
        for (let y = 0; y < height; y += stepY) {
          samplePixel(0, y);
          samplePixel(width - 1, y);
        }

        const isDarkBg = forceBlack || (darkBorderPixels / Math.max(1, totalSampled) > 0.45);
        const isLightBg = !isDarkBg && (lightBorderPixels / Math.max(1, totalSampled) > 0.45);

        if (isDarkBg) {
          // Process black/dark background removal
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue;

            // Compute luminance / peak brightness
            const brightness = Math.max(r, g, b);

            if (brightness <= blackCutoff) {
              // 100% transparent for black background
              data[i + 3] = 0;
            } else if (brightness < solidThreshold) {
              // Anti-aliased edge smoothing between dark background and gold emblem
              const factor = (brightness - blackCutoff) / (solidThreshold - blackCutoff);
              data[i + 3] = Math.round(a * factor);

              // Un-premultiply black to eliminate dark halos around gold details
              const safeDiv = Math.max(0.2, factor);
              data[i] = Math.min(255, Math.round(r / safeDiv));
              data[i + 1] = Math.min(255, Math.round(g / safeDiv));
              data[i + 2] = Math.min(255, Math.round(b / safeDiv));
            }
          }

          ctx.putImageData(imgData, 0, 0);
        } else if (isLightBg) {
          // Process white/light background removal
          const whiteCutoff = 238;
          const solidLightCutoff = 190;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue;

            const minChannel = Math.min(r, g, b);
            if (minChannel >= whiteCutoff) {
              data[i + 3] = 0;
            } else if (minChannel > solidLightCutoff) {
              const factor = (whiteCutoff - minChannel) / (whiteCutoff - solidLightCutoff);
              data[i + 3] = Math.round(a * factor);
            }
          }

          ctx.putImageData(imgData, 0, 0);
        }

        const pngDataUrl = canvas.toDataURL('image/png');
        if (shouldRevoke) URL.revokeObjectURL(srcUrl);
        resolve(pngDataUrl);
      } catch (err) {
        if (shouldRevoke) URL.revokeObjectURL(srcUrl);
        // Fallback to original
        if (typeof imageSource === 'string') {
          resolve(imageSource);
        } else {
          reject(err);
        }
      }
    };

    img.onerror = (e) => {
      if (shouldRevoke) URL.revokeObjectURL(srcUrl);
      if (typeof imageSource === 'string') {
        resolve(imageSource);
      } else {
        reject(e);
      }
    };

    img.src = srcUrl;
  });
}
