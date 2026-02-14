"use client";

export function Footer() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Ovlae. All rights reserved.</p>
        <p>Lifeboard by Ovlae</p>
      </div>
    </footer>
  );
}
