"use client";

import { useEffect, useRef } from "react";
import { compileProgram } from "./compile";
import { VERTEX_SHADER, buildFragmentShader } from "./glsl";
import type { ShaderId } from "./types";

interface UseShaderRendererOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  shaderId: ShaderId;
  imageSrc: string;
}

export function useShaderRenderer({
  canvasRef,
  shaderId,
  imageSrc,
}: UseShaderRendererOptions) {
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const programsRef = useRef<Map<ShaderId, WebGLProgram>>(new Map());
  const shaderIdRef = useRef<ShaderId>(shaderId);

  useEffect(() => {
    shaderIdRef.current = shaderId;
  }, [shaderId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;
    glRef.current = gl;

    const programs = programsRef.current;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    textureRef.current = texture;

    const getProgram = (id: ShaderId) => {
      const cached = programs.get(id);
      if (cached) return cached;
      const program = compileProgram(gl, VERTEX_SHADER, buildFragmentShader(id));
      if (program) programs.set(id, program);
      return program;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mouse: [number, number] = [0.5, 0.5];
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse[0] = (e.clientX - rect.left) / rect.width;
      mouse[1] = 1 - (e.clientY - rect.top) / rect.height;
    };
    canvas.addEventListener("pointermove", handlePointerMove);

    const start = performance.now();
    let rafId = 0;

    const render = () => {
      const program = getProgram(shaderIdRef.current);
      if (program) {
        gl.useProgram(program);

        const posLoc = gl.getAttribLocation(program, "a_position");
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
        gl.uniform1i(gl.getUniformLocation(program, "u_tex"), 0);
        gl.uniform2f(
          gl.getUniformLocation(program, "u_resolution"),
          canvas.width,
          canvas.height
        );
        gl.uniform1f(
          gl.getUniformLocation(program, "u_time"),
          (performance.now() - start) / 1000
        );
        gl.uniform2f(
          gl.getUniformLocation(program, "u_mouse"),
          mouse[0],
          mouse[1]
        );

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(
          gl.SRC_ALPHA,
          gl.ONE_MINUS_SRC_ALPHA,
          gl.ONE,
          gl.ONE_MINUS_SRC_ALPHA
        );
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener("pointermove", handlePointerMove);
      programs.forEach((program) => gl.deleteProgram(program));
      programs.clear();
      gl.deleteTexture(textureRef.current);
      gl.deleteBuffer(positionBuffer);
      glRef.current = null;
    };
  }, [canvasRef]);

  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;
    let cancelled = false;

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;

      const size = 1024;
      const offscreen = document.createElement("canvas");
      offscreen.width = size;
      offscreen.height = size;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);
      const padding = size * 0.12;
      const maxDim = size - padding * 2;
      const ratio = Math.min(maxDim / img.width, maxDim / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);
    };
    img.src = imageSrc;

    return () => {
      cancelled = true;
    };
  }, [imageSrc]);
}
