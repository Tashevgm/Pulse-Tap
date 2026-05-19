import type { ReactNode } from "react";

type LegalSection = {
  title: string;
  body: ReactNode;
};

export function LegalPage({
  eyebrow,
  title,
  intro,
  sections
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="bg-ink">
      <section className="bg-premium-radial px-5 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">{eyebrow}</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/66">{intro}</p>
          <p className="mt-5 text-sm text-white/46">Last updated: 19 May 2026</p>
        </div>
      </section>

      <section className="px-5 py-14 md:py-16">
        <div className="mx-auto max-w-4xl space-y-5">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6">
              <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-white/66">{section.body}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
