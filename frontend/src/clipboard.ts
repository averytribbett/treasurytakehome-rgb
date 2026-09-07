export function filesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) return [];

  const fromItems: File[] = [];
  for (const item of Array.from(data.items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) fromItems.push(file);
    }
  }
  if (fromItems.length > 0) return fromItems;

  return Array.from(data.files).filter((file) => file.type.startsWith("image/"));
}

export function fileFromImageBlob(blob: Blob): File {
  const subtype = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
  const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  return new File([blob], `pasted-label-${id}.${subtype}`, { type: blob.type || "image/png" });
}

export async function filesFromClipboard(): Promise<File[]> {
  if (!navigator.clipboard?.read) return [];
  const items = await navigator.clipboard.read();
  const files: File[] = [];
  for (const item of items) {
    const type = item.types.find((value) => value.startsWith("image/"));
    if (!type) continue;
    files.push(fileFromImageBlob(await item.getType(type)));
  }
  return files;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "TEXTAREA" || tag === "INPUT" || target.isContentEditable;
}
