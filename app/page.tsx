"use client";

import ShaderStage from "@/components/shaders/shader-stage";
import { ShaderId } from "@/components/shaders/types";
import { useState } from "react";

export default function Home() {
  const [imageSrc] = useState("/triangle.svg");
  const [shaderId] = useState<ShaderId>("chrome");

  return <ShaderStage shaderId={shaderId} imageSrc={imageSrc} />;
}
