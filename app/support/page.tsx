import type { Metadata } from "next";
import { CircleHelp, QrCode, Smartphone, Wifi } from "lucide-react";

export const metadata: Metadata = {
  title: "Support",
  description: "PulseTap onboarding guides for iPhone NFC, Android NFC, QR scanning and troubleshooting."
};

const guides = [
  {
    title: "iPhone NFC tap area",
    icon: Smartphone,
    copy: "Hold the top edge of the iPhone near the PulseTap card or stand. Newer iPhones read NFC automatically from the lock screen or home screen."
  },
  {
    title: "Android NFC tap area",
    icon: Smartphone,
    copy: "Tap the back middle or upper back of the phone against the product. Some Android phones require NFC to be enabled in quick settings."
  },
  {
    title: "QR backup",
    icon: QrCode,
    copy: "Open the camera, point it at the QR code, then tap the browser prompt. QR is the fallback when NFC is unavailable."
  },
  {
    title: "WiFi products",
    icon: Wifi,
    copy: "WiFi cards can open a connection prompt or a destination page, depending on the setup chosen for the venue."
  }
];

const troubleshooting = [
  "Remove thick metal cases or wallets before tapping.",
  "Try the QR code if the phone does not react after two seconds.",
  "Check that the card has been activated with the printed activation code.",
  "Confirm the destination URL starts with a valid website or profile link.",
  "On Android, make sure NFC is enabled in settings."
];

export default function SupportPage() {
  return (
    <main className="bg-ink">
      <section className="bg-premium-radial px-5 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">Support</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">Simple setup guides for every tap.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/66">
            PulseTap is built to work without an app. These guides help customers find the NFC area, use QR backup and troubleshoot activation.
          </p>
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
          {guides.map((guide) => (
            <article key={guide.title} className="glass rounded-[2rem] p-6">
              <guide.icon className="h-6 w-6 text-pulse" />
              <h2 className="mt-6 text-2xl font-semibold">{guide.title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/62">{guide.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-volt">Troubleshooting</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">If a tap does not open instantly.</h2>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045]">
            {troubleshooting.map((item) => (
              <div key={item} className="flex gap-3 border-b border-white/10 p-5 last:border-b-0">
                <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-pulse" />
                <p className="text-sm leading-6 text-white/66">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
