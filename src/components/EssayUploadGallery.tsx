import type { UploadPurpose } from "@prisma/client";

type EssayUpload = {
  id: string;
  purpose: UploadPurpose;
  fileName: string;
  mimeType: string;
  normalizedText: string | null;
};

export function EssayUploadGallery({ uploads }: { uploads: EssayUpload[] }) {
  if (uploads.length === 0) {
    return null;
  }

  return (
    <section className="writing-panel mt-5 p-4 sm:p-5" aria-label="本次上传图片">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="coach-eyebrow">图片材料</p>
          <h2 className="text-lg font-semibold text-[var(--aw-text)]">
            随作文保留的上传图片
          </h2>
        </div>
        <p className="text-sm text-[var(--aw-text-muted)]">
          {uploads.length} 张图片已随本次批改保存
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {uploads.map((upload) => (
          <article key={upload.id} className="essay-upload-card">
            <img
              src={`/api/uploads/${upload.id}`}
              alt={`${getPurposeLabel(upload.purpose)}图片：${upload.fileName}`}
              className="essay-upload-card-image"
            />
            <div className="p-3">
              <p className="text-sm font-semibold text-[var(--aw-text)]">
                {getPurposeLabel(upload.purpose)}
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-[var(--aw-text-muted)]">
                {upload.fileName}
              </p>
              {upload.normalizedText ? (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--aw-text-muted)]">
                  {upload.normalizedText}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function getPurposeLabel(purpose: UploadPurpose) {
  return purpose === "PROMPT" ? "题目图片" : "正文图片";
}
