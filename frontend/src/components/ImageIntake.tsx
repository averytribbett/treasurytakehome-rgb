import { useEffect, useRef } from "react";
import {
  filesFromClipboard,
  filesFromDataTransfer,
  isTypingTarget,
} from "../clipboard";

interface Props {
  hasImage: boolean;
  disabled?: boolean;
  windowPaste?: boolean;
  active?: boolean;
  onActivate?: () => void;
  onImage: (file: File) => void;
  children: React.ReactNode;
}

export function ImageIntake({
  hasImage,
  disabled,
  windowPaste = true,
  active = false,
  onActivate,
  onImage,
  children,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onImageRef = useRef(onImage);
  onImageRef.current = onImage;

  function emit(files: File[]) {
    const file = files[0];
    if (file) onImageRef.current(file);
  }

  useEffect(() => {
    if (!windowPaste) return;

    function onPaste(event: ClipboardEvent) {
      if (disabled || isTypingTarget(event.target)) return;
      const files = filesFromDataTransfer(event.clipboardData);
      if (files.length === 0) return;
      event.preventDefault();
      emit(files);
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [disabled, windowPaste]);

  async function onPasteClick() {
    if (disabled) return;
    onActivate?.();
    try {
      const files = await filesFromClipboard();
      if (files.length === 0) {
        window.alert("Copy a label image first, then click paste screenshot.");
        return;
      }
      emit(files);
    } catch {
      window.alert("This browser blocked clipboard access. Click the box and press Ctrl+V or Cmd+V.");
    }
  }

  return (
    <div
      className={`drop ${hasImage ? "has-file" : ""} ${active ? "active" : ""}`}
      tabIndex={0}
      onClick={onActivate}
      onFocus={onActivate}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (disabled) return;
        onActivate?.();
        emit(filesFromDataTransfer(event.dataTransfer));
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []).filter((file) =>
            file.type.startsWith("image/"),
          );
          emit(files);
          event.target.value = "";
        }}
      />
      <div className="drop-body">{children}</div>
      <div className="drop-actions">
        <button
          className="btn"
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </button>
        <button className="btn secondary" type="button" disabled={disabled} onClick={() => void onPasteClick()}>
          Paste screenshot
        </button>
      </div>
    </div>
  );
}
