"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cx } from "@/components/ui";
import { siteConfig } from "@/config/site";

const links = [
  { href: "/", label: "خانه" },
  { href: "/booking/", label: "رزرو آنلاین" },
  { href: "/account/", label: "پنل من" },
  { href: "/admin/", label: "مدیر" },
  { href: "/coach/", label: "مربی" },
];

export function SiteHeader() {
  const pathname = (usePathname() ?? "/").replace(/\/+$/, "") || "/";

  const isActive = (href: string) => {
    const clean = href.replace(/\/+$/, "") || "/";
    if (clean === "/") return pathname === "/";
    return pathname === clean || pathname.startsWith(`${clean}/`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 rounded-xl transition-opacity hover:opacity-85"
          >
            <Logo />
            <span className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-tight">
                {siteConfig.brand.name}
              </span>
              <span className="mt-1 text-[10px] font-semibold text-muted">
                {siteConfig.brand.tagline}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cx(
                    "rounded-full px-3 py-2 text-xs font-bold transition-colors",
                    isActive(link.href)
                      ? "bg-brand/10 text-brand"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <ThemeToggle />
          </div>
        </div>

        <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cx(
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                isActive(link.href)
                  ? "bg-brand-strong text-white"
                  : "border border-line bg-surface text-muted",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
