import { z } from "zod";

const englishSingleSentence = z
  .string()
  .min(1)
  .refine((value) => countSentenceEndings(value) <= 1, {
    message: "Hint completion must be a single sentence"
  });

export const writingHintSchema = z.object({
  completion: englishSingleSentence,
  reason: z.string().min(1),
  expressionFocus: z.string().min(1),
  styleNote: z.string().min(1),
  referenceLabel: z.string().min(1)
});

export type WritingHint = z.infer<typeof writingHintSchema>;

function countSentenceEndings(value: string) {
  return (value.match(/[.!?。！？]/g) ?? []).length;
}
