"use client";

import { useState } from "react";
import Header from "../header";
import ShaderStage from "./shader-stage";
import UploadSvgButton from "../upload-svg-button";
import type { ShaderId } from "./types";

export default function ShaderApp() {
  const [shaderId, setShaderId] = useState<ShaderId>("chrome");
  const [imageSrc, setImageSrc] = useState("/triangle.svg");

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <Header active={shaderId} onSelect={setShaderId} />
      <ShaderStage shaderId={shaderId} imageSrc={imageSrc} />
      <UploadSvgButton onUpload={setImageSrc} />
    </div>
  );
}
