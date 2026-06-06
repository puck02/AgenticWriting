import { describe, expect, it, vi } from "vitest";

import { prepareImageForOcr } from "@/services/ocr/image-preprocessor";

describe("prepareImageForOcr", () => {
  it("keeps small images unchanged", async () => {
    const file = new File(["small"], "essay.png", { type: "image/png" });

    const result = await prepareImageForOcr(file, {
      maxSide: 1600,
      minBytesToCompress: 100
    });

    expect(result).toBe(file);
  });

  it("downscales oversized raster images before OCR upload", async () => {
    const file = new File([new Uint8Array(2_000_000)], "essay.png", {
      type: "image/png"
    });
    const drawImage = vi.fn();
    const close = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({ drawImage }),
      toBlob: vi.fn((callback: BlobCallback, type: string) => {
        callback(new Blob(["compressed"], { type }));
      })
    };

    const result = await prepareImageForOcr(
      file,
      {
        maxSide: 1600,
        minBytesToCompress: 100,
        outputType: "image/jpeg",
        quality: 0.82
      },
      {
        createImageBitmap: vi.fn().mockResolvedValue({
          width: 4000,
          height: 2000,
          close
        }),
        createCanvas: vi.fn().mockReturnValue(canvas)
      }
    );

    expect(result).not.toBe(file);
    expect(result.name).toBe("essay.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(800);
    expect(drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
