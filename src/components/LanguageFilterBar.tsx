"use client";

import React from "react";
import { Filter } from "lucide-react";

export type SnippetLanguageFilter =
  | "all"
  | "cpp"
  | "rust"
  | "typescript"
  | "python"
  | "sql";

interface FilterOption {
  value: SnippetLanguageFilter;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Logs" },
  { value: "cpp", label: "C++20" },
  { value: "rust", label: "Rust" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "sql", label: "SQL" },
];

interface LanguageFilterBarProps {
  selectedLanguage: SnippetLanguageFilter;
  onSelectLanguage: (lang: SnippetLanguageFilter) => void;
  countsByLanguage?: Partial<Record<SnippetLanguageFilter, number>>;
}

export function LanguageFilterBar({
  selectedLanguage,
  onSelectLanguage,
  countsByLanguage,
}: LanguageFilterBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter posts by snippet language"
      className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-2.5"
    >
      <span className="inline-flex items-center gap-1.5 px-2 text-xs font-medium text-zinc-400">
        <Filter className="h-3.5 w-3.5 text-emerald-400" />
        Language:
      </span>

      {FILTER_OPTIONS.map((option) => {
        const active = selectedLanguage === option.value;
        const count = countsByLanguage?.[option.value];

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelectLanguage(option.value)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-emerald-500 text-zinc-950 font-semibold shadow-xs"
                : "bg-zinc-950/70 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white"
            }`}
          >
            <span>{option.label}</span>
            {typeof count === "number" && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  active
                    ? "bg-zinc-950/20 text-zinc-950"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}