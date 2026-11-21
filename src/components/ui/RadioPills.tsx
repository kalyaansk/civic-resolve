"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface RadioPillOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  /** Optional extra classes applied when this option is selected. */
  checkedClassName?: string;
}

interface RadioPillsProps<T extends string> {
  /** Accessible name of the radiogroup. */
  label: string;
  options: readonly RadioPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  optionClassName?: string;
  /** `segmented` renders borderless options for use inside a joined segmented control. */
  variant?: "pill" | "segmented";
}

/**
 * Accessible single-select pill group implementing the WAI-ARIA radiogroup pattern:
 * `role="radiogroup"` + `role="radio"` + `aria-checked`, roving tabindex, and
 * arrow/Home/End keyboard navigation. Selection is never conveyed by color alone —
 * the checked option always renders a visible check indicator and heavier styling.
 */
export function RadioPills<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className,
  optionClassName,
  variant = "pill",
}: RadioPillsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveTo = (index: number) => {
    const next = (index + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    refs.current[next]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveTo(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveTo(index - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(options.length - 1);
        break;
    }
  };

  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60",
              checked
                ? cn(
                    "border-[#1B365D] bg-[#1B365D] text-white shadow-xs",
                    option.checkedClassName,
                  )
                : variant === "segmented"
                  ? "border-transparent bg-transparent text-[#334155] hover:bg-white"
                  : "border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F1F5F9]",
              optionClassName,
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
