"use client";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import UploadSvgButton from "@/components/upload-svg-button";
import Header from "@/components/header";
import type { ShaderId } from "@/components/shaders/types";
import { useState } from "react";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [, setImageSrc] = useState("/triangle.svg");
  const [shaderId, setShaderId] = useState<ShaderId>("chrome");

  return (
    <ThemeProvider>
      {/* Header and shader stage */}
      <Header active={shaderId} onSelect={setShaderId} />

      {/* Main content area */}
      <main className="min-h-screen w-full">{children}</main>

      {/* Theme switcher and upload button */}
      <div className="fixed bottom-6 right-6 z-20 flex items-center gap-6">
        <ThemeSwitcher />
        <UploadSvgButton onUpload={setImageSrc} />
      </div>
    </ThemeProvider>
  );
}
