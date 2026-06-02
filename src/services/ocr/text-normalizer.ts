export function normalizeOcrText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s+([,.;:!?])/g, "$1")
        .replace(/([([{])\s+/g, "$1")
        .replace(/\s+([)\]}])/g, "$1")
        .replace(/\s{2,}/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
