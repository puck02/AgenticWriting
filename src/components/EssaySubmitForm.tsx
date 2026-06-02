"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

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
        <div>
          <label
            htmlFor="essayType"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            作文类型
          </label>
          <select
            id="essayType"
            value={essayType}
            onChange={(event) => setEssayType(event.target.value as EssayTypeValue)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          >
            {essayTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="prompt"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            作文题目
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            required
            rows={4}
            className="min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            placeholder="粘贴题干、图表信息或应用文要求"
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            作文正文
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            rows={14}
            className="min-h-80 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            placeholder="输入或粘贴你的英文作文"
          />
        </div>
      </fieldset>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      >
        {isPending ? "正在批改..." : "提交批改"}
      </button>
    </form>
  );
}
