import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { readLocalStoredUpload } from "@/services/uploads/upload-storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(db);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const upload = await db.uploadAsset.findFirst({
    where: {
      id,
      userId: user.id
    }
  });

  if (!upload) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  try {
    const storedFile = await readLocalStoredUpload({
      storageKey: upload.storageKey,
      mimeType: upload.mimeType
    });

    return new NextResponse(new Uint8Array(storedFile.bytes), {
      headers: {
        "Content-Type": storedFile.mimeType,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Upload file unavailable" }, { status: 404 });
  }
}
