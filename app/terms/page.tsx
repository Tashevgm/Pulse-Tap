import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "PulseTap website, product, account and checkout terms."
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      intro="These terms explain how customers can use the PulseTap website, products, activation flow, profile tools and checkout."
      sections={[
        {
          title: "Who we are",
          body: (
            <>
              <p>
                PulseTap is a product of Pixel Solutions Ltd. In these terms, “PulseTap”, “we”, “us” and “our” refer to
                Pixel Solutions Ltd and the PulseTap product ecosystem.
              </p>
              <p>
                You can contact us about these terms at <a className="text-pulse hover:text-white" href="mailto:info@pulse-tap.com">info@pulse-tap.com</a>.
              </p>
            </>
          )
        },
        {
          title: "PulseTap products",
          body: (
            <p>
              PulseTap sells NFC and QR products including review cards, social cards, QR stands and related smart
              products. Products are designed to open a PulseTap activation or redirect link when tapped or scanned.
              The final destination can be managed through the PulseTap activation and profile tools.
            </p>
          )
        },
        {
          title: "Activation and redirects",
          body: (
            <>
              <p>
                Each compatible product may include a permanent PulseTap link or claim code. During activation, you add
                the destination URL that your NFC or QR product should open. You are responsible for making sure your
                destination URL is accurate, lawful and safe for customers to visit.
              </p>
              <p>
                We may block or remove destinations that are harmful, illegal, misleading, abusive, or likely to damage
                PulseTap, customers, visitors or third-party services.
              </p>
            </>
          )
        },
        {
          title: "Accounts",
          body: (
            <p>
              Some features require an account, including managing activated products, editing redirect URLs and viewing
              card activity. You must keep your login details secure and provide accurate account information.
            </p>
          )
        },
        {
          title: "Orders and payment",
          body: (
            <p>
              Checkout is handled by Stripe. Prices, delivery charges and available payment methods are shown during
              checkout before payment. Orders are not accepted until payment is completed successfully.
            </p>
          )
        },
        {
          title: "Delivery",
          body: (
            <p>
              Delivery options and charges are shown at checkout. Delivery times are estimates and can be affected by
              carrier delays, incorrect addresses, customs checks or events outside our control.
            </p>
          )
        },
        {
          title: "Returns and issues",
          body: (
            <p>
              If there is a problem with your order, contact us as soon as possible. Custom or programmed products may
              have different return handling where they have been made or configured specifically for you, but this does
              not affect your statutory rights.
            </p>
          )
        },
        {
          title: "Service availability",
          body: (
            <p>
              We aim to keep PulseTap online and reliable, but we do not guarantee uninterrupted access. We may update,
              maintain, suspend or change parts of the website, activation tools or redirect services when needed.
            </p>
          )
        },
        {
          title: "Third-party services",
          body: (
            <p>
              PulseTap may connect with services such as Google, Instagram, Facebook, TikTok, Stripe, Supabase and
              Resend. These services are operated by third parties and may have their own terms and policies.
            </p>
          )
        },
        {
          title: "Changes to these terms",
          body: (
            <p>
              We may update these terms as PulseTap develops. The latest version will be published on this page with the
              updated date.
            </p>
          )
        }
      ]}
    />
  );
}
