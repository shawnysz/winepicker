import { NextRequest, NextResponse } from "next/server";
import { readWineLabel } from "@/lib/vision/label-reader";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    const mediaType = file.type as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";

    const result = await readWineLabel(base64, mediaType);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error scanning label:", error);
    return NextResponse.json(
      { error: "Failed to scan label" },
      { status: 500 }
    );
  }
}
