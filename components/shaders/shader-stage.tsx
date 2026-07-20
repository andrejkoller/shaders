"use client";

import { useRef } from "react";
import { useShaderRenderer } from "./use-shader-renderer";
import type { ShaderId } from "./types";

interface ShaderStageProps {
  shaderId: ShaderId;
  imageSrc: string;
}

export default function ShaderStage({ shaderId, imageSrc }: ShaderStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useShaderRenderer({ canvasRef, shaderId, imageSrc });

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
