export const essayTypes = [
  { value: "ENGLISH_ONE_PICTURE", label: "英语一大作文：图画作文" },
  { value: "ENGLISH_TWO_CHART", label: "英语二大作文：图表作文" },
  { value: "SMALL_APPLICATION", label: "小作文：应用文" }
] as const;

export const rejectLabels = [
  { value: "TOO_COMPLEX", label: "太复杂" },
  { value: "NOT_MY_STYLE", label: "不像我会写的" },
  { value: "MEANING_CHANGED", label: "意思变了" },
  { value: "NOT_EXAM_STYLE", label: "不符合考研风格" },
  { value: "PREFER_ORIGINAL", label: "我更喜欢原句" },
  { value: "UNFAMILIAR_WORDS", label: "用词不熟悉" }
] as const;

export type EssayTypeValue = (typeof essayTypes)[number]["value"];
export type RejectLabelValue = (typeof rejectLabels)[number]["value"];
