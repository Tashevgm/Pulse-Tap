import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PulseTap collects, uses and protects customer data."
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy policy"
      intro="This policy explains what information PulseTap collects, why we use it, and the choices customers have."
      sections={[
        {
          title: "Who controls your data",
          body: (
            <p>
              PulseTap is a product of Pixel Solutions Ltd. For PulseTap website, account, order and activation data,
              Pixel Solutions Ltd is the controller of your personal data. You can contact us at{" "}
              <a className="text-pulse hover:text-white" href="mailto:info@pulse-tap.com">info@pulse-tap.com</a>.
            </p>
          )
        },
        {
          title: "Information we collect",
          body: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Account details such as name, email address, business name and login provider.</li>
              <li>Order details such as product, email address, payment status and delivery information.</li>
              <li>Activation details such as card ID, claim token, product type and saved redirect URL.</li>
              <li>Tap activity such as tap count, redirect visits, timestamp, user agent and referrer.</li>
              <li>Support messages or emails you send to us.</li>
            </ul>
          )
        },
        {
          title: "How we use information",
          body: (
            <ul className="list-disc space-y-2 pl-5">
              <li>To provide accounts, product activation, editable redirects and profile tools.</li>
              <li>To process payments, orders, delivery and order confirmation emails.</li>
              <li>To show basic activity data such as taps, last tap time and review page visits.</li>
              <li>To provide support, troubleshoot issues and protect the service from misuse.</li>
              <li>To improve PulseTap products, onboarding and website performance.</li>
            </ul>
          )
        },
        {
          title: "Legal reasons for using data",
          body: (
            <p>
              We use personal data where it is needed to provide the service or fulfil an order, where we have a
              legitimate interest in operating and improving PulseTap, where we need to comply with legal obligations,
              or where you have given consent for a specific optional use.
            </p>
          )
        },
        {
          title: "Payments and checkout",
          body: (
            <p>
              Payments are processed by Stripe. PulseTap does not store full card numbers. Stripe may collect and process
              payment, billing, fraud prevention and checkout information under its own terms and privacy notices.
            </p>
          )
        },
        {
          title: "Service providers",
          body: (
            <p>
              We use trusted providers to operate PulseTap, including Supabase for authentication and database services,
              Stripe for checkout and payments, Resend for app emails, Vercel for hosting and GitHub for code hosting.
              These providers process data only as needed to provide their services to us.
            </p>
          )
        },
        {
          title: "How long we keep data",
          body: (
            <p>
              We keep account, card and order data for as long as needed to provide PulseTap, support customers, maintain
              records and meet legal obligations. You can ask us to delete or update your account information, subject to
              records we must keep for legal, tax, fraud prevention or dispute reasons.
            </p>
          )
        },
        {
          title: "Your rights",
          body: (
            <p>
              Depending on where you live, you may have rights to access, correct, delete, restrict or object to the use
              of your personal data, and to request a copy of your data. You can contact us to exercise these rights.
            </p>
          )
        },
        {
          title: "Security",
          body: (
            <p>
              We use reasonable technical and organisational measures to protect PulseTap data. No online service can be
              guaranteed completely secure, so customers should use strong passwords and keep account access private.
            </p>
          )
        },
        {
          title: "Updates",
          body: (
            <p>
              We may update this privacy policy as PulseTap develops. The latest version will be published on this page
              with the updated date.
            </p>
          )
        }
      ]}
    />
  );
}
