import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, LockKeyhole, Smartphone } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to PulseTap to manage NFC and QR products."
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

const authErrorTitles: Record<string, string> = {
  callback: "Verification could not finish automatically",
  "missing-code": "Verification link is missing a code",
  "no-user": "Account was not returned",
  profile: "PulseTap profile could not be opened",
  server_error: "Sign in provider setup needs attention",
  unexpected_failure: "Sign in provider setup needs attention"
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error = "", message = "" } = await searchParams;
  const errorTitle = error ? authErrorTitles[error] ?? "Sign in needs attention" : "";

  return (
    <main className="min-h-screen bg-premium-radial px-5 py-14">
      <section className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">Customer Login</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
            Manage your PulseTap products.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/66">
            Log in to update card links, view QR backups, and check product activity.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: BadgeCheck, title: "Your products", copy: "View every card connected to your profile." },
              { icon: Smartphone, title: "Editable links", copy: "Change destinations from any browser." },
              { icon: LockKeyhole, title: "Secure access", copy: "Google and email login are powered by Supabase Auth." }
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
                <item.icon className="h-5 w-5 text-pulse" />
                <p className="mt-3 font-semibold">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-white/58">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-[2rem] p-5 md:p-8">
          <div className="rounded-3xl border border-white/10 bg-black/24 p-5">
            <p className="text-sm font-semibold text-white/82">PulseTap account</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Log in</h2>
            <p className="mt-3 text-sm leading-6 text-white/58">
              Continue with Google or log in with email and password.
            </p>
          </div>

          <Link
            href="/api/auth/google?next=%2Fdashboard"
            className="focus-ring mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-4 text-sm font-semibold text-ink transition hover:bg-pulse"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full border border-black/10 text-base font-bold">G</span>
            Continue with Google
            <ArrowRight className="h-4 w-4" />
          </Link>

          {error ? (
            <div className="mt-4 rounded-3xl border border-coral/30 bg-coral/10 p-4">
              <p className="text-sm font-semibold text-white">{errorTitle}</p>
              <p className="mt-1 text-sm leading-6 text-white/66">
                {message || "Check the Supabase Google provider settings and try again."}
              </p>
            </div>
          ) : null}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <LoginForm />

          <p className="mt-5 text-center text-sm leading-6 text-white/48">
            Need an account?{" "}
            <Link href="/signup" className="font-semibold text-white hover:text-pulse">
              Create one
            </Link>
          </p>
          <p className="mt-2 text-center text-sm leading-6 text-white/48">
            Forgot your password?{" "}
            <Link href="/forgot-password" className="font-semibold text-white hover:text-pulse">
              Send reset link
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
