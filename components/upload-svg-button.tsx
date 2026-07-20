"use client";

import { useRef, type ChangeEvent } from "react";

interface UploadSvgButtonProps {
  onUpload: (dataUrl: string) => void;
  className?: string;
}

export default function UploadSvgButton({
  onUpload,
  className,
}: UploadSvgButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isSvg =
      file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    if (!isSvg) return;

    // Read as a data URL and render it through an <img>/<canvas> pair only.
    // Browsers never execute scripts embedded in an SVG used as an image
    // source, so this stays safe without needing to sanitize the markup.
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpload(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`rounded-md bg-(--color-foreground) px-4 py-2 tracking-wide text-(--color-background) transition-colors hover:bg-(--color-foreground)/90 focus:bg-(--color-foreground)/90 focus:outline-none ${className ?? ""}`}
      >
        Upload SVG
      </button>
    </>
  );
}
