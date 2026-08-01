export type PreparedImageUpload = {
  name: string;
  type: string;
  base64: string;
  previewUrl: string;
};

export async function prepareImageUploads(
  pendingImages: Array<{ file: File; previewUrl: string }>,
): Promise<PreparedImageUpload[]> {
  return Promise.all(
    pendingImages.map(
      (pending) =>
        new Promise<PreparedImageUpload>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = String(reader.result ?? "");
            resolve({
              name: pending.file.name,
              type: pending.file.type || "image/jpeg",
              base64: result.includes(",") ? result.split(",")[1] : result,
              previewUrl: pending.previewUrl,
            });
          };
          reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
          reader.readAsDataURL(pending.file);
        }),
    ),
  );
}