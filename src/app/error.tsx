"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-xl">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-white">
          Something went wrong in DevPulse
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
          {error.message || "An unexpected client error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try Again
        </button>
      </div>
    </div>
  );
}