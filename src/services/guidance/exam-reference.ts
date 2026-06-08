import type { EssayTypeValue } from "@/domain/labels";

type ExamReference = {
  range: string;
  essayType: EssayTypeValue;
  patterns: string[];
  coachingFocus: string[];
};

const recentExamReferences: ExamReference[] = [
  {
    range: "2016-2025",
    essayType: "ENGLISH_ONE_PICTURE",
    patterns: [
      "图画作文常围绕价值观、社会责任、个人成长、教育与公共行为展开。",
      "高分表达通常先点明图画含义，再解释原因或影响，最后回到行动建议。"
    ],
    coachingFocus: [
      "避免只描述画面，要补出抽象主题。",
      "句子补全优先承接上一句逻辑，不跳到万能模板。"
    ]
  },
  {
    range: "2016-2025",
    essayType: "ENGLISH_TWO_CHART",
    patterns: [
      "图表作文常考阅读、消费、就业、教育、文化活动和生活方式等趋势。",
      "高分段落通常先描述变化，再解释变化背后的现实原因。"
    ],
    coachingFocus: [
      "补全句应说明趋势意义或原因，不重复数字。",
      "保持表达自然正式，少用生硬复杂词。"
    ]
  },
  {
    range: "2016-2025",
    essayType: "SMALL_APPLICATION",
    patterns: [
      "应用文常考建议信、邀请、告示、推荐、道歉和咨询。",
      "高分表达依赖明确对象、具体目的和礼貌但简洁的语气。"
    ],
    coachingFocus: [
      "补全句要服务具体交际目的。",
      "避免堆砌华丽词，保持清晰礼貌。"
    ]
  }
];

export function getExamReferenceSummary(essayType: EssayTypeValue) {
  const references = recentExamReferences.filter(
    (reference) => reference.essayType === essayType
  );

  return references
    .map((reference) =>
      [
        `Range: ${reference.range}`,
        `Essay type: ${reference.essayType}`,
        `Patterns: ${reference.patterns.join(" ")}`,
        `Coaching focus: ${reference.coachingFocus.join(" ")}`
      ].join("\n")
    )
    .join("\n\n");
}
