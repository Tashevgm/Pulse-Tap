import Link from "next/link";
import { Activity, ArrowRight, UserRound } from "lucide-react";
import { cookies } from "next/headers";
import { getCurrentProfile } from "@/lib/user-repository";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/dashboard", label: "Profile" },
  { href: "/support", label: "Support" }
];

export async function Header() {
  const cookieStore = await cookies();
  const profile = await getCurrentProfile(cookieStore.get("pulsetap_user_id")?.value);
  const isSignedIn = Boolean(profile?.isAuthenticated);

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
            href="/dashboard"
            aria-label="Open profile"
            className="focus-ring inline-grid h-10 w-10 place-items-center rounded-full border border-white/14 bg-white/8 text-white transition hover:bg-white/14 md:hidden"
          >
            <UserRound className="h-4 w-4" />
          </Link>
          {isSignedIn ? (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="focus-ring inline-flex items-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/14"
              >
                Log out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="focus-ring inline-flex items-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              Log In
            </Link>
          )}
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
