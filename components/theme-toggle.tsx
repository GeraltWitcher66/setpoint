"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);

    try {
      window.localStorage.setItem("setpoint.theme", next ? "dark" : "light");
    } catch {
      // Ignore storage failures.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="تغییر حالت تاریک"
      title="حالت تاریک"
      className="grid size-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-foreground"
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </button>
  );
}
