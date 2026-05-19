import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How PulseTap uses cookies and similar technologies."
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      title="Cookie policy"
      intro="This policy explains how PulseTap uses cookies and similar browser technologies."
      sections={[
        {
          title: "What cookies are",
          body: (
            <p>
              Cookies are small files or browser storage items used by websites to remember information. Similar
              technologies can include local storage, session storage and pixels.
            </p>
          )
        },
        {
          title: "Cookie choices",
          body: (
            <p>
              When you first visit PulseTap, we show a cookie choices form. You can accept all cookies, reject optional
              cookies, or manage categories. Optional analytics and marketing categories are off by default. You can
              reopen the form using Cookie settings in the footer.
            </p>
          )
        },
        {
          title: "Essential cookies",
          body: (
            <p>
              PulseTap uses essential cookies and similar technologies to run the website, keep users signed in, protect
              checkout and authentication, remember security states, and provide requested features such as activation,
              account access and Stripe Checkout. These are needed for the service to work.
            </p>
          )
        },
        {
          title: "Authentication and account cookies",
          body: (
            <p>
              Supabase authentication may use cookies or browser storage to keep you logged in and manage secure signup,
              login, email verification and password reset flows.
            </p>
          )
        },
        {
          title: "Checkout cookies",
          body: (
            <p>
              Stripe may use cookies and similar technologies during checkout to process payments, prevent fraud, support
              payment methods and remember checkout information where you choose to use those features.
            </p>
          )
        },
        {
          title: "Analytics and marketing cookies",
          body: (
            <p>
              PulseTap does not currently set optional analytics or advertising cookies from the website. If we add
              optional analytics or marketing tools later, we will update this policy and provide any consent controls
              required before using them.
            </p>
          )
        },
        {
          title: "Managing cookies",
          body: (
            <p>
              You can control cookies through your browser settings. Blocking essential cookies may stop parts of
              PulseTap from working correctly, including login, activation, checkout and profile management.
            </p>
          )
        },
        {
          title: "Consent storage",
          body: (
            <p>
              We store your cookie preference in your browser so we can remember your choice. This preference record is
              used only to apply your cookie settings and avoid asking you on every page.
            </p>
          )
        },
        {
          title: "Changes to this policy",
          body: (
            <p>
              We may update this cookie policy if our use of cookies or similar technologies changes. The latest version
              will be published on this page with the updated date.
            </p>
          )
        }
      ]}
    />
  );
}
