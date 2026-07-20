"use client";

import { useState } from "react";
import Header from "../header";
import { ThemeSwitcher } from "../theme/theme-switcher";
import ShaderStage from "./shader-stage";
import UploadSvgButton from "../upload-svg-button";
import type { ShaderId } from "./types";

export default function ShaderApp() {
  const [shaderId, setShaderId] = useState<ShaderId>("chrome");
  const [imageSrc, setImageSrc] = useState("/triangle.svg");

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background text-foreground">
      <Header active={shaderId} onSelect={setShaderId} />
      <ShaderStage shaderId={shaderId} imageSrc={imageSrc} />
      <div className="fixed bottom-6 right-6 z-20 flex items-center gap-6">
        <ThemeSwitcher />
        <UploadSvgButton onUpload={setImageSrc} />
      </div>
    </div>
  );
}
