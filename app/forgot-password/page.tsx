import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Send a PulseTap password reset link to your email address."
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-premium-radial px-5 py-14">
      <section className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">Account Recovery</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">Reset your PulseTap password.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/66">
            Enter the email used for your PulseTap account. We will send a secure link to set a new password.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/62 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { icon: Mail, title: "Email reset link", copy: "The link is sent by Supabase Auth." },
              { icon: ShieldCheck, title: "Secure session", copy: "Only the email link can open the reset form." }
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
                <item.icon className="h-5 w-5 text-pulse" />
                <p className="mt-3 font-semibold text-white">{item.title}</p>
                <p className="mt-1 leading-6">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-[2rem] p-5 md:p-8">
          <div className="rounded-3xl border border-white/10 bg-black/24 p-5">
            <p className="text-sm font-semibold text-white/82">Forgot password</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Send reset link</h2>
            <p className="mt-3 text-sm leading-6 text-white/58">
              Use the email address connected to your PulseTap profile.
            </p>
          </div>

          <ForgotPasswordForm />

          <Link href="/signup" className="mt-5 inline-flex items-center text-sm font-semibold text-white/58 hover:text-pulse">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign up
          </Link>
        </div>
      </section>
    </main>
  );
}
