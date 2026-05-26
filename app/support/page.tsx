import type { Metadata } from "next";
import { CircleHelp, Link2, MousePointerClick, QrCode, ScanLine, Smartphone, Wifi } from "lucide-react";

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
  "Confirm the destination URL starts with a valid website or profile link.",
  "On Android, make sure NFC is enabled in settings."
];

const programmingSteps = [
  {
    title: "Tap or scan your card",
    copy: "Hold your phone near the PulseTap card or scan the QR code to open the activation page automatically.",
    icon: Smartphone
  },
  {
    title: "Check the card is detected",
    copy: "The page should show your card details, so you do not need to type the activation code manually.",
    icon: ScanLine
  },
  {
    title: "Add your destination URL",
    copy: "Paste the website, review page, social profile or menu link you want customers to open.",
    icon: Link2
  },
  {
    title: "Click Activate Card",
    copy: "After activation, every tap or scan of the same card will open your saved destination link.",
    icon: MousePointerClick
  }
];

const tutorialVideoUrl = "https://player.vimeo.com/video/1195554609";

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
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-volt">Video Tutorial</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">How to activate your PulseTap card.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/64">
              Tap your card, add your destination URL and activate it. After setup, the card will send visitors straight to your saved link.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {programmingSteps.map((step) => (
                <div key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                  <step.icon className="h-5 w-5 text-pulse" />
                  <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/58">{step.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-soft lg:mr-0">
            <div className="relative aspect-[9/16] bg-black">
              <iframe
                className="h-full w-full"
                src={tutorialVideoUrl}
                title="How to activate your PulseTap card"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                allowFullScreen
              />
            </div>
            <div className="border-t border-white/10 p-5">
              <p className="text-sm font-semibold">Programming checklist</p>
              <p className="mt-2 text-sm leading-6 text-white/58">
                If the card is new, the first tap opens activation. Once activated, the same card opens your destination link automatically.
              </p>
            </div>
          </div>
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
