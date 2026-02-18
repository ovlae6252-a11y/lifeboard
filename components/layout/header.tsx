import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AdminLink } from "./admin-link";
import { MobileNav } from "./mobile-nav";
import { navLinks } from "./nav-links";

export function Header() {
  return (
    <header className="border-border/50 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-xs">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/protected"
            className="font-serif text-lg font-bold tracking-tight"
          >
            Lifeboard
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {label}
              </Link>
            ))}
            <Suspense fallback={null}>
              <AdminLink />
            </Suspense>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <Suspense>
            <AuthButton />
          </Suspense>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
