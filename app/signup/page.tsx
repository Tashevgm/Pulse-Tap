import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, LockKeyhole, Smartphone } from "lucide-react";
import { SignUpForm } from "@/components/signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a PulseTap account with email and password to manage NFC and QR products."
};

type SignUpPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

const authErrorTitles: Record<string, string> = {
  callback: "Email verification could not finish",
  "missing-code": "Verification link is missing a code",
  "no-user": "Account was not returned",
  profile: "PulseTap profile could not be created",
  server_error: "Account setup needs attention",
  unexpected_failure: "Account setup needs attention"
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { error = "", message = "" } = await searchParams;
  const errorTitle = error ? authErrorTitles[error] ?? "Sign in needs attention" : "";

  return (
    <main className="min-h-screen bg-premium-radial px-5 py-14">
      <section className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">Create Account</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
            Register and manage every PulseTap product.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/66">
            Your account gives you access to activated cards, QR backups, editable redirects and profile tools.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: BadgeCheck, title: "All products", copy: "View cards and stands connected to your profile." },
              { icon: Smartphone, title: "No app required", copy: "Manage links from the browser." },
              { icon: LockKeyhole, title: "Secure access", copy: "Email verification is powered by Supabase Auth." }
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
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign up</h2>
            <p className="mt-3 text-sm leading-6 text-white/58">
              Create an account with email and password. We will send a verification link before first login.
            </p>
          </div>

          {error ? (
            <div className="mt-6 rounded-3xl border border-coral/30 bg-coral/10 p-4">
              <p className="text-sm font-semibold text-white">{errorTitle}</p>
              <p className="mt-1 text-sm leading-6 text-white/66">
                {message || "Try logging in with your email and password. If needed, request a new verification email."}
              </p>
            </div>
          ) : null}

          <SignUpForm />

          <p className="mt-5 text-center text-sm leading-6 text-white/48">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-white hover:text-pulse">
              Log in
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
