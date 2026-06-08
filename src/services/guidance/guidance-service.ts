import type { EssayTypeValue } from "@/domain/labels";
import type { MemorySnapshot } from "@/domain/memory";
import { writingHintSchema, type WritingHint } from "@/domain/guidance";
import { rankMemoryForReview } from "@/services/memory/memory-service";
import type { ModelProvider } from "@/services/review/model-provider";
import { getExamReferenceSummary } from "@/services/guidance/exam-reference";

export async function generateWritingHint({
  provider,
  essayType,
  prompt,
  draft,
  memory
}: {
  provider: Pick<ModelProvider, "completeJson">;
  essayType: EssayTypeValue;
  prompt: string;
  draft: string;
  memory: MemorySnapshot;
}): Promise<WritingHint> {
  const output = await provider.completeJson(
    buildGuidancePrompt({ essayType, prompt, draft, memory })
  );

  return writingHintSchema.parse(JSON.parse(output));
}

export function buildGuidancePrompt({
  essayType,
  prompt,
  draft,
  memory
}: {
  essayType: EssayTypeValue;
  prompt: string;
  draft: string;
  memory: MemorySnapshot;
}) {
  const rankedMemory = rankMemoryForReview({ memory, essayType });

  return [
    "你是考研英语写作私人 coach，任务是像 Copilot 一样在用户停顿时只补全一句英文。",
    "只补全一句英文，不要替用户写完整段落。",
    "补全句必须自然延续用户当前草稿，贴合用户已有表达习惯。",
    "如果用户草稿不足，给出稳妥开头句；如果已有草稿，优先承接最后一句。",
    "Return only valid JSON matching this schema:",
    JSON.stringify({
      completion: "one English sentence only",
      reason: "简短中文说明，解释为什么这样补",
      expressionFocus: "中文标签，例如 描述趋势/解释原因/提出建议",
      styleNote: "中文说明，说明如何贴合用户风格",
      referenceLabel: "参考素材标签"
    }),
    `Essay type: ${essayType}`,
    `Prompt: ${prompt}`,
    `Current draft: ${draft}`,
    `User memory: ${JSON.stringify(rankedMemory)}`,
    `2016-2025 exam reference summary:\n${getExamReferenceSummary(essayType)}`
  ].join("\n\n");
}
