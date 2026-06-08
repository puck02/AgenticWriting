export const reviewModels = [
  { value: "gpt-5.4-mini", label: "GPT-5.4 mini" },
  { value: "gpt-5.5", label: "GPT-5.5" }
] as const;

export const defaultReviewModel = "gpt-5.4-mini";

export type ReviewModelValue = (typeof reviewModels)[number]["value"];

export function isReviewModelValue(value: string): value is ReviewModelValue {
  return reviewModels.some((model) => model.value === value);
}
