import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EssayUploadGallery } from "@/components/EssayUploadGallery";

describe("EssayUploadGallery", () => {
  it("renders saved upload images for an essay", () => {
    render(
      <EssayUploadGallery
        uploads={[
          {
            id: "upload-1",
            purpose: "PROMPT",
            fileName: "prompt.png",
            mimeType: "image/png",
            normalizedText: "Write about a chart."
          },
          {
            id: "upload-2",
            purpose: "CONTENT",
            fileName: "essay.png",
            mimeType: "image/png",
            normalizedText: "Practice is important."
          }
        ]}
      />
    );

    expect(screen.getByRole("region", { name: "本次上传图片" })).toBeTruthy();
    expect(
      (screen.getByAltText("题目图片图片：prompt.png") as HTMLImageElement).src
    ).toContain("/api/uploads/upload-1");
    expect(
      (screen.getByAltText("正文图片图片：essay.png") as HTMLImageElement).src
    ).toContain("/api/uploads/upload-2");
    expect(screen.getByText("2 张图片已随本次批改保存")).toBeTruthy();
  });

  it("renders nothing when there are no saved uploads", () => {
    const { container } = render(<EssayUploadGallery uploads={[]} />);

    expect(container.innerHTML).toBe("");
  });
});
