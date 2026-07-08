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
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex min-w-0 items-center gap-2 rounded-full">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink">
            <Activity className="h-5 w-5" />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">PulseTap</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
          {nav.map((item) => (
            <Link key={item.href} className="transition hover:text-white" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              aria-label="Open profile"
              className="focus-ring inline-grid h-9 w-9 place-items-center rounded-full border border-white/14 bg-white/8 text-white transition hover:bg-white/14 md:hidden"
            >
              <UserRound className="h-4 w-4" />
            </Link>
          ) : null}
          {isSignedIn ? (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="focus-ring inline-flex h-9 items-center rounded-full border border-white/14 bg-white/8 px-3 text-sm font-semibold text-white transition hover:bg-white/14 sm:h-10 sm:px-4"
              >
                Log out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="focus-ring inline-flex h-9 items-center rounded-full border border-white/14 bg-white/8 px-3 text-sm font-semibold text-white transition hover:bg-white/14 sm:h-10 sm:px-4"
            >
              Log In
            </Link>
          )}
          <Link
            href="/activate"
            className="focus-ring inline-flex h-9 items-center rounded-full bg-white px-3 text-sm font-semibold text-ink transition hover:bg-pulse sm:h-10 sm:px-4"
          >
            Activate
            <ArrowRight className="ml-1.5 h-4 w-4 sm:ml-2" />
          </Link>
        </div>
      </div>
    </header>
  );
}
