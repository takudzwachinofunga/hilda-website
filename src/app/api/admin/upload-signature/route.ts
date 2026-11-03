import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/auth";
import { createUploadSignature, isCloudinaryConfigured, UPLOAD_RULES } from "@/lib/cloudinary";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary is not configured. Add CLOUDINARY_* variables to your environment." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    resourceType?: string;
    fileSize?: number;
    fileType?: string;
  };
  const resourceType = body.resourceType === "video" ? "video" : "image";
  const rules = UPLOAD_RULES[resourceType];

  // Early validation (Cloudinary enforces formats; the server re-verifies after upload).
  if (typeof body.fileSize === "number" && body.fileSize > rules.maxBytes) {
    return NextResponse.json(
      { error: `File is too large. Maximum is ${Math.round(rules.maxBytes / 1024 / 1024)} MB.` },
      { status: 413 },
    );
  }
  if (body.fileType && !body.fileType.startsWith(`${resourceType}/`)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  }

  return NextResponse.json(createUploadSignature(resourceType), {
    headers: { "Cache-Control": "no-store" },
  });
}
