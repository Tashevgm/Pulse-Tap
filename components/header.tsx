import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";

const nav = [
  { href: "/products", label: "Products" },
  { href: "/dashboard", label: "Profile" },
  { href: "/support", label: "Support" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/78 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex items-center gap-2 rounded-full">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink">
            <Activity className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold tracking-tight">PulseTap</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
          {nav.map((item) => (
            <Link key={item.href} className="transition hover:text-white" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/signup"
            className="focus-ring inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-pulse"
          >
            Sign Up
          </Link>
          <Link
            href="/activate"
            className="focus-ring inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-pulse"
          >
            Activate
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
