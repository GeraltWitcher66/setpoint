"use client";

import { X } from "lucide-react";
import { useSyncExternalStore } from "react";

const DISMISS_KEY = "setpoint.v1.banner-dismissed";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function DemoBanner() {
  const hidden = useSyncExternalStore(subscribe, getSnapshot, () => false);

  if (hidden) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore storage failures.
    }
    for (const listener of listeners) listener();
  }

  return (
    <div className="bg-accent text-accent-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-1.5">
        <p className="text-[11px] font-bold sm:text-xs">
          این یک نسخه نمایشی است؛ داده‌ها واقعی نیستند.
        </p>
        <button
          type="button"
          aria-label="بستن نوار نسخه نمایشی"
          onClick={dismiss}
          className="rounded-full p-1 transition-opacity hover:opacity-70"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
