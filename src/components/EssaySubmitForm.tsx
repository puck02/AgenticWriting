"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  IslandButton,
  IslandCard,
  IslandGlyph,
  IslandSelect
} from "@/components/IslandUi";
import { essayTypes, type EssayTypeValue } from "@/domain/labels";

export function EssaySubmitForm() {
  const router = useRouter();
  const [essayType, setEssayType] = useState<EssayTypeValue>(essayTypes[0].value);
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayType, prompt, content })
      });

      if (!response.ok) {
        throw new Error("提交失败，请检查作文题目和正文。");
      }

      const data = (await response.json()) as { essayId?: string };

      if (!data.essayId) {
        throw new Error("批改结果缺少作文编号。");
      }

      router.push(`/essays/${data.essayId}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "提交失败，请稍后重试。"
      );
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset disabled={isPending} className="space-y-5">
        <IslandCard color="yellow" className="space-y-3 p-4">
          <label
            htmlFor="essayType"
            className="flex items-center gap-2 text-sm font-bold text-[#725d42]"
          >
            <IslandGlyph label="题型">T</IslandGlyph>
            作文类型
          </label>
          <IslandSelect
            id="essayType"
            value={essayType}
            onChange={(event) => setEssayType(event.target.value as EssayTypeValue)}
          >
            {essayTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </IslandSelect>
        </IslandCard>

        <div>
          <label
            htmlFor="prompt"
            className="mb-2 flex items-center gap-2 text-sm font-bold text-[#725d42]"
          >
            <IslandGlyph label="题目">P</IslandGlyph>
            作文题目
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            required
            rows={4}
            className="writing-textarea min-h-28 px-4 py-3 text-sm leading-6 placeholder:text-[#9a835a]/60"
            placeholder="粘贴题干、图表信息或应用文要求"
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="mb-2 flex items-center gap-2 text-sm font-bold text-[#725d42]"
          >
            <IslandGlyph label="正文">E</IslandGlyph>
            作文正文
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            rows={14}
            className="writing-textarea min-h-80 px-4 py-3 font-mono text-sm leading-7 placeholder:text-[#9a835a]/60"
            placeholder="输入或粘贴你的英文作文"
          />
        </div>
      </fieldset>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <IslandButton
        type="submit"
        disabled={isPending}
        loading={isPending}
        variant="primary"
        size="large"
      >
        {isPending ? "正在批改..." : "提交批改"}
      </IslandButton>
    </form>
  );
}
