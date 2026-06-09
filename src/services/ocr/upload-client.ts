import type { UploadPurposeValue } from "@/domain/uploads";
import { prepareImageForOcr } from "@/services/ocr/image-preprocessor";

export type OcrUploadClientResult = {
  uploadId: string | null;
  normalizedText: string;
  status: "READY" | "FAILED";
  error?: string;
};

export async function uploadImageForOcr({
  purpose,
  file
}: {
  purpose: UploadPurposeValue;
  file: File;
}): Promise<OcrUploadClientResult> {
  const uploadFile = await prepareImageForOcr(file);
  const formData = new FormData();
  formData.set("purpose", purpose);
  formData.set("file", uploadFile);

  const response = await fetch("/api/uploads/ocr", {
    method: "POST",
    body: formData
  });
  const data = (await readUploadResponseJson(response)) as {
    uploadId?: string | null;
    normalizedText?: string;
    status?: "READY" | "FAILED";
    error?: string;
    errorMessage?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "图片识别失败");
  }

  if (data.status === "FAILED" && data.uploadId) {
    return {
      uploadId: data.uploadId,
      normalizedText: "",
      status: "FAILED",
      error: getSavedUploadErrorMessage(data.error ?? data.errorMessage)
    };
  }

  if (!data.normalizedText) {
    throw new Error(data.error ?? "图片识别失败");
  }

  return {
    uploadId: data.uploadId ?? null,
    normalizedText: data.normalizedText,
    status: "READY"
  };
}

function getSavedUploadErrorMessage(message: string | undefined) {
  if (!message || message.startsWith("Model provider") || message.includes("fetch failed")) {
    return "图片已保存，但文字识别暂时不可用。";
  }

  return message;
}

async function readUploadResponseJson(response: Response): Promise<unknown> {
  const contentType = response.headers?.get("content-type") ?? "";

  if (contentType && !contentType.includes("application/json")) {
    await response.text().catch(() => "");
    throw new Error("图片识别服务暂时不可用，请稍后重试。");
  }

  return response.json().catch(() => {
    throw new Error("图片识别服务返回异常，请稍后重试。");
  });
}
