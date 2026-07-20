"use client";

import { SHADERS, type ShaderId } from "./shaders/types";

interface HeaderProps {
  active: ShaderId;
  onSelect: (id: ShaderId) => void;
}

export default function Header({ active, onSelect }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-center pt-5">
      <nav className="flex flex-wrap items-center justify-center gap-6">
        {SHADERS.map((shader) => (
          <button
            key={shader.id}
            type="button"
            onClick={() => onSelect(shader.id)}
            aria-pressed={active === shader.id}
            title={`Select ${shader.label} shader`}
            aria-label={`Select ${shader.label} shader`}
            className={`tracking-wide transition-colors scale-95 cursor-pointer ${
              active === shader.id
                ? "text-(--color-foreground) scale-100"
                : "text-(--color-muted) hover:text-(--color-primary) focus:text-(--color-primary) focus:outline-none"
            }`}
          >
            {shader.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
