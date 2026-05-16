import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChartNoAxesCombined, Link2, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { categories, products, steps } from "@/lib/products";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { MotionDiv, MotionSection } from "@/components/motion";

const testimonials = [
  {
    quote: "We put PulseTap cards at reception and reviews started coming in the same day.",
    name: "Maya",
    role: "Clinic owner"
  },
  {
    quote: "Customers understand it instantly. Tap, open, done. The QR backup is useful too.",
    name: "Jordan",
    role: "Cafe operator"
  },
  {
    quote: "The NFC card feels like a product, but the editable link behind it is the real win.",
    name: "Amir",
    role: "Creative director"
  }
];

const faqs = [
  {
    q: "Do customers need an app?",
    a: "No. PulseTap opens through the phone browser using NFC or QR."
  },
  {
    q: "Can I change where my card goes later?",
    a: "Yes. V1 supports editable redirects, with space to grow into profiles, analytics and B2B account tools."
  },
  {
    q: "What happens if NFC is turned off?",
    a: "Every PulseTap product can include a QR backup, so the destination still opens from the camera."
  },
  {
    q: "Can it work for restaurants?",
    a: "Yes. Table stands and counter products can launch menus, WiFi, reviews, socials or custom links."
  }
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-ink">
      <section className="relative bg-premium-radial px-5 pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <MotionDiv
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-3 py-2 text-xs font-medium text-white/72">
              <Sparkles className="h-4 w-4 text-pulse" />
              Smart NFC + QR Products
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
              Tap. Activate. Done.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68 md:text-xl">
              Premium NFC and QR products for reviews, socials, WiFi, business profiles and restaurants. The modern way to connect businesses and customers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/activate">Activate Your Card</ButtonLink>
              <ButtonLink href="/products" variant="secondary">
                Explore Products
              </ButtonLink>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm text-white/58">
              {["No app required", "QR backup", "Editable links"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <BadgeCheck className="mb-2 h-4 w-4 text-volt" />
                  {item}
                </div>
              ))}
            </div>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative min-h-[480px]"
          >
            <div className="absolute inset-x-4 top-8 h-[420px] rounded-[2rem] bg-pulse/10 blur-3xl" />
            <div className="glass relative mx-auto max-w-[520px] rounded-[2rem] p-4">
              <div className="relative h-[430px] overflow-hidden rounded-[1.5rem]">
                <Image
                  src="https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=1400&q=85"
                  alt="Premium smart card and phone product setup"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/12 bg-black/45 p-4 backdrop-blur-xl">
                  <p className="text-sm font-semibold">PT0001 activated</p>
                  <p className="mt-1 text-sm text-white/58">Google Review Card redirects to your live destination.</p>
                </div>
              </div>
            </div>
          </MotionDiv>
        </div>
      </section>

      <MotionSection
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="px-5 py-20"
      >
        <SectionHeading
          eyebrow="Featured Products"
          title="Physical products with software inside."
          copy="Cards, stands and NFC touchpoints that turn real-world moments into useful digital actions."
        />
        <div className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <Link key={product.id} href="/products" className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045]">
              <div className="relative h-64 overflow-hidden">
                <Image src={product.image} alt={product.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className={`absolute inset-0 bg-gradient-to-t ${product.accent}`} />
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-pulse">{product.category}</p>
                <h3 className="mt-3 text-xl font-semibold">{product.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{product.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </MotionSection>

      <section className="bg-white/[0.035] px-5 py-20">
        <SectionHeading
          eyebrow="How It Works"
          title="Built for normal people, not setup calls."
          copy="PulseTap keeps activation simple while leaving room for analytics, subscriptions and business accounts later."
        />
        <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="glass rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <step.icon className="h-6 w-6 text-pulse" />
                <span className="text-sm text-white/38">0{index + 1}</span>
              </div>
              <h3 className="mt-8 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/60">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
            <Image
              src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1400&q=85"
              alt="Phone opening a web profile without an app"
              width={1400}
              height={950}
              className="h-[420px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-3xl font-semibold">No app required.</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/68">NFC opens the browser. QR works as a fallback. The product feels simple because the software stays behind the scenes.</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-pulse">Product Categories</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">One ecosystem for everyday customer actions.</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <div key={category.name} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <category.icon className="h-5 w-5 text-volt" />
                  <h3 className="mt-4 font-semibold">{category.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/58">{category.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/[0.035] px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-pulse">Profile Ecosystem</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Cards, redirects and profiles that stay editable.</h2>
            <p className="mt-5 text-base leading-7 text-white/64">
              V1 focuses on activation and redirects. The same structure can grow into multiple cards per user, profile pages, QR generation, tap analytics, subscriptions and B2B accounts.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Link2, title: "Editable Links", copy: "Update the destination behind any card." },
              { icon: Smartphone, title: "Mobile First", copy: "Activation is designed for phone screens." },
              { icon: ChartNoAxesCombined, title: "Analytics Ready", copy: "Data model leaves room for tap insights." }
            ].map((item) => (
              <div key={item.title} className="glass rounded-3xl p-5">
                <item.icon className="h-5 w-5 text-pulse" />
                <h3 className="mt-6 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <SectionHeading eyebrow="Proof" title="Made for counters, tables and real workflows." copy="Simple enough for customers, flexible enough for the businesses using it every day." />
        <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure key={testimonial.name} className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
              <ShieldCheck className="h-5 w-5 text-volt" />
              <blockquote className="mt-5 text-base leading-7 text-white/78">"{testimonial.quote}"</blockquote>
              <figcaption className="mt-6 text-sm text-white/50">
                <span className="font-semibold text-white">{testimonial.name}</span> · {testimonial.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.035] px-5 py-20">
        <SectionHeading eyebrow="FAQ" title="Fast answers before activation." copy="PulseTap is designed to be obvious at the point of use." />
        <div className="mx-auto mt-10 max-w-4xl divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/[0.045]">
          {faqs.map((faq) => (
            <div key={faq.q} className="p-6">
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-premium-radial p-8 text-center md:p-14">
          <p className="text-sm uppercase tracking-[0.32em] text-pulse">Ready</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">Activate your PulseTap product in under a minute.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/activate">Activate Your Card</ButtonLink>
            <ButtonLink href="/products" variant="secondary">Explore Products</ButtonLink>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/[0.045] p-6 md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-volt">Ecosystem</p>
            <h2 className="mt-3 text-2xl font-semibold">Sister platform: PulseMenu</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">For restaurants that need digital menus alongside NFC and QR touchpoints.</p>
          </div>
          <Link href="https://pulse-menu.com" className="focus-ring mt-5 inline-flex items-center rounded-full border border-white/14 px-5 py-3 text-sm font-semibold md:mt-0">
            Visit PulseMenu
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
