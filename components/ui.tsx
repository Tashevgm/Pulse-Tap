import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  const className =
    variant === "primary"
      ? "focus-ring inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-pulse"
      : "focus-ring inline-flex items-center justify-center rounded-full border border-white/14 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/28 hover:bg-white/10";

  return (
    <Link href={href} className={className}>
      {children}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Link>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-pulse">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-white/64 md:text-lg">{copy}</p>
    </div>
  );
}
