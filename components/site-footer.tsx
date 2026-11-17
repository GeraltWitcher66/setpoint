import { copy } from "@/lib/copy";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/80 bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold text-foreground">{copy.footer.rights}</span>
        <span>{copy.footer.note}</span>
      </div>
    </footer>
  );
}
