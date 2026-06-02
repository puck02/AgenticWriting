"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { IslandButton } from "@/components/IslandUi";

type OcrPurpose = "PROMPT" | "CONTENT";
type OcrUploadStatus = "idle" | "uploading" | "ready" | "failed";

export function OcrUploadControl({
  purpose,
  label,
  onRecognized
}: {
  purpose: OcrPurpose;
  label: string;
  onRecognized(text: string): void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
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
      const formData = new FormData();
      formData.set("purpose", purpose);
      formData.set("file", file);

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

      onRecognized(data.normalizedText);
      setStatus("ready");
      setMessage("识别完成，请核对后再提交。");
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "图片识别失败");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <IslandButton
        type="button"
        size="small"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
      >
        {status === "uploading" ? "识别中..." : label}
      </IslandButton>
      {message ? (
        <p
          className={
            status === "failed"
              ? "text-sm text-red-700"
              : "text-sm text-[#725d42]"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
