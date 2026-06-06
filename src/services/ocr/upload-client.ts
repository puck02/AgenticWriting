import type { UploadPurposeValue } from "@/domain/uploads";
import { prepareImageForOcr } from "@/services/ocr/image-preprocessor";

export async function uploadImageForOcr({
  purpose,
  file
}: {
  purpose: UploadPurposeValue;
  file: File;
}): Promise<string> {
  const uploadFile = await prepareImageForOcr(file);
  const formData = new FormData();
  formData.set("purpose", purpose);
  formData.set("file", uploadFile);

  const response = await fetch("/api/uploads/ocr", {
    method: "POST",
    body: formData
  });
  const data = (await response.json()) as {
    normalizedText?: string;
    error?: string;
  };

  if (!response.ok || !data.normalizedText) {
    throw new Error(data.error ?? "图片识别失败");
  }

  return data.normalizedText;
}
