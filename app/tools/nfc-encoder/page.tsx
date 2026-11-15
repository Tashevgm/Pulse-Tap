import type { Metadata } from "next";
import { LockKeyhole, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "NFC Programming Enquiries",
  description: "NFC programming access is available by enquiry only."
};

export default function NfcEncoderPage() {
  return (
    <main className="min-h-screen bg-ink">
      <section className="bg-premium-radial px-5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-pulse"><LockKeyhole className="h-4 w-4" />Locked ? Enquiries only</p>
          <h1 className="mt-6 text-4xl font-semibold md:text-7xl">NFC Programming</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/62 md:text-lg">Need to program NFC products for your business? Contact us to discuss your requirements, compatible readers and production volumes.</p>
          <div className="mt-8 border border-white/12 bg-white/[0.045] p-6">
            <LockKeyhole className="h-6 w-6 text-volt" />
            <h2 className="mt-4 text-2xl font-semibold">Access by arrangement only</h2>
            <p className="mt-3 text-sm leading-7 text-white/58">The NFC encoder is locked. Creating an account or signing in does not unlock programming access. Send an enquiry to discuss access with our team.</p>
            <a href="mailto:info@pulse-tap.com?subject=NFC%20Programming%20Enquiry" className="focus-ring mt-6 inline-flex items-center justify-center bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-pulse"><Mail className="mr-2 h-4 w-4" />Enquire about NFC programming</a>
            <p className="mt-4 text-sm text-white/58">Email <a href="mailto:info@pulse-tap.com?subject=NFC%20Programming%20Enquiry" className="text-pulse hover:text-white">info@pulse-tap.com</a> with your business name and requirements.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
