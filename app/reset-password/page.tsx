import type { Metadata } from "next";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your PulseTap account."
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-premium-radial px-5 py-14">
      <section className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">Secure Reset</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">Create a new password.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/66">
            Choose a new password for your PulseTap account. After updating it, you can open your profile and manage your products.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/62 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { icon: LockKeyhole, title: "New password", copy: "Use at least 8 characters." },
              { icon: ShieldCheck, title: "Protected account", copy: "The reset link signs you in for this update only." }
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
            <p className="text-sm font-semibold text-white/82">PulseTap account</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Reset password</h2>
            <p className="mt-3 text-sm leading-6 text-white/58">
              Enter and confirm your new password.
            </p>
          </div>

          <ResetPasswordForm />
        </div>
      </section>
    </main>
  );
}
