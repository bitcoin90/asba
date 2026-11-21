"use client";

export interface UploadResult {
  id: number;
  url: string;
  filename: string;
  width: number;
  height: number;
  size: number;
}

/** يقلص أبعاد الصورة ويضغطها في المتصفح قبل الرفع لتسريع الموقع */
export async function processImage(file: File, maxDim = 1600, quality = 0.85): Promise<Blob> {
  if (file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("تعذر معالجة الصورة"))),
      mime,
      mime === "image/jpeg" ? quality : undefined
    );
  });
}

/** يرفع صورة (بعد معالجتها) إلى المكتبة ويعيد بياناتها */
export async function uploadImage(file: File): Promise<UploadResult> {
  const blob = await processImage(file);
  const fd = new FormData();
  fd.append("file", new File([blob], file.name.replace(/\.[^.]+$/, blob.type === "image/png" ? ".png" : ".jpg"), { type: blob.type }));
  fd.append("width", "");
  fd.append("height", "");
  // أبعاد الصورة بعد التصغير
  try {
    const bmp = await createImageBitmap(blob);
    fd.set("width", String(bmp.width));
    fd.set("height", String(bmp.height));
    bmp.close?.();
  } catch {}

  const res = await fetch("/api/admin/media", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "فشل رفع الصورة");
  return json as UploadResult;
}
