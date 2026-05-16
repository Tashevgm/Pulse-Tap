import Link from "next/link";
import { Activity } from "lucide-react";

const links = [
  { href: "/products", label: "Products" },
  { href: "/activate", label: "Activate" },
  { href: "/dashboard", label: "Profile" },
  { href: "/support", label: "Support" },
  { href: "https://pulse-menu.com", label: "PulseMenu" }
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink">
              <Activity className="h-5 w-5" />
            </span>
            <span className="font-semibold">PulseTap</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/56">
            PulseTap is a product of Pixel Solutions Ltd.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/60">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
