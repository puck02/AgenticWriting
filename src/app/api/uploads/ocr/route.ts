import { NextResponse, type NextRequest } from "next/server";

import { uploadPurposeSchema } from "@/domain/uploads";
import { db } from "@/lib/db";
import { getOrCreateCurrentUser } from "@/lib/session";
import { createOcrDraft, MockOcrAdapter, processOcrUpload } from "@/services/ocr/ocr-service";

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
  }

  const parsedPurpose = uploadPurposeSchema.safeParse(formData.get("purpose"));
  const file = formData.get("file");

  if (!parsedPurpose.success || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
  }

  try {
    const user = await getOrCreateCurrentUser(db);
    const result = await processOcrUpload({
      db,
      userId: user.id,
      purpose: parsedPurpose.data,
      file,
      adapter: new MockOcrAdapter()
    });

    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      try {
        const result = await createOcrDraft({
          file,
          adapter: new MockOcrAdapter()
        });

        return NextResponse.json(result);
      } catch (draftError) {
        return NextResponse.json(
          {
            error: getErrorMessage(draftError)
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: getErrorMessage(error)
      },
      { status: 400 }
    );
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "OCR failed";
}
