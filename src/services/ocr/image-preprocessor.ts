const defaultMaxSide = 1600;
const defaultMinBytesToCompress = 1_000_000;
const defaultOutputType = "image/jpeg";
const defaultQuality = 0.82;

type ImageBitmapLike = {
  width: number;
  height: number;
  close?: () => void;
};

type CanvasLike = {
  width: number;
  height: number;
  getContext(contextId: "2d"): CanvasRenderingContext2D | null;
  toBlob(callback: BlobCallback, type?: string, quality?: number): void;
};

type ImagePreprocessorOptions = {
  maxSide?: number;
  minBytesToCompress?: number;
  outputType?: string;
  quality?: number;
};

type ImagePreprocessorDependencies = {
  createImageBitmap?: (file: File) => Promise<ImageBitmapLike>;
  createCanvas?: () => CanvasLike;
};

export async function prepareImageForOcr(
  file: File,
  options: ImagePreprocessorOptions = {},
  dependencies: ImagePreprocessorDependencies = {}
): Promise<File> {
  const maxSide = options.maxSide ?? defaultMaxSide;
  const minBytesToCompress =
    options.minBytesToCompress ?? defaultMinBytesToCompress;

  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  if (file.size < minBytesToCompress) {
    return file;
  }

  const createBitmap = dependencies.createImageBitmap ?? globalThis.createImageBitmap;
  const createCanvas =
    dependencies.createCanvas ??
    (() => document.createElement("canvas") as CanvasLike);

  if (!createBitmap || typeof document === "undefined") {
    return file;
  }

  try {
    const bitmap = await createBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

    if (scale >= 1) {
      bitmap.close?.();
      return file;
    }

    const canvas = createCanvas();
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close?.();
      return file;
    }

    context.drawImage(bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const outputType = options.outputType ?? defaultOutputType;
    const blob = await canvasToBlob(
      canvas,
      outputType,
      options.quality ?? defaultQuality
    );

    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], replaceExtension(file.name, extensionForMime(outputType)), {
      type: outputType,
      lastModified: file.lastModified
    });
  } catch {
    return file;
  }
}

function canvasToBlob(
  canvas: CanvasLike,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function replaceExtension(fileName: string, extension: string): string {
  const normalizedExtension = extension.startsWith(".") ? extension : `.${extension}`;

  return fileName.includes(".")
    ? fileName.replace(/\.[^.]+$/, normalizedExtension)
    : `${fileName}${normalizedExtension}`;
}

function extensionForMime(mimeType: string): string {
  if (mimeType === "image/webp") {
    return ".webp";
  }

  return ".jpg";
}
