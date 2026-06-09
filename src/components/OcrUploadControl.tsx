"use client";

import { useState, type ChangeEvent } from "react";

import { uploadImageForOcr } from "@/services/ocr/upload-client";

type OcrPurpose = "PROMPT" | "CONTENT";
type OcrUploadStatus = "idle" | "uploading" | "ready" | "failed";
export type OcrRecognizedUpload = {
  uploadId: string | null;
  normalizedText: string;
  status: "READY" | "FAILED";
  error?: string;
};

export function OcrUploadControl({
  purpose,
  label,
  onRecognized
}: {
  purpose: OcrPurpose;
  label: string;
  onRecognized(upload: OcrRecognizedUpload): void;
}) {
  const [status, setStatus] = useState<OcrUploadStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setStatus("uploading");
    setMessage("正在识别图片文字...");

    try {
      const recognized = await uploadImageForOcr({ purpose, file });
      onRecognized(recognized);
      if (recognized.status === "FAILED") {
        setStatus("failed");
        setMessage(recognized.error ?? "图片已保存，但文字识别暂时不可用。");
      } else {
        setStatus("ready");
        setMessage("识别完成，请核对后再提交。");
      }
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "图片识别失败");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label
        className={[
          "island-button island-button-default island-button-small overflow-hidden",
          status === "uploading" ? "cursor-not-allowed opacity-55" : "cursor-pointer"
        ].join(" ")}
      >
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={status === "uploading"}
          onChange={handleFileChange}
        />
        <span>{status === "uploading" ? "识别中..." : label}</span>
      </label>
      {message ? (
        <p
          className={
            status === "failed"
              ? "text-sm text-red-700"
              : "text-sm text-[var(--aw-text-muted)]"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
