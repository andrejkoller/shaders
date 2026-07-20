export type ShaderId =
  | "chrome"
  | "metal"
  | "glares"
  | "dither"
  | "particles"
  | "ripples"
  | "ascii"
  | "lines";

export interface ShaderDefinition {
  id: ShaderId;
  label: string;
}

export const SHADERS: ShaderDefinition[] = [
  { id: "chrome", label: "Chrome" },
  { id: "metal", label: "Metal" },
  { id: "glares", label: "Glares" },
  { id: "dither", label: "Dither" },
  { id: "particles", label: "Particles" },
  { id: "ripples", label: "Ripples" },
  { id: "ascii", label: "Ascii" },
  { id: "lines", label: "Lines" },
];
