"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type CookieConsentValue = {
  version: 1;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
};

const clarityProjectId = "x93ogdjcwe";
const storageKey = "pulsetap_cookie_consent";

function hasAnalyticsConsent() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return false;
    }

    return Boolean((JSON.parse(stored) as CookieConsentValue).analytics);
  } catch {
    return false;
  }
}

export function ClarityAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hasAnalyticsConsent());

    function updateConsent(event: Event) {
      const consent = (event as CustomEvent<CookieConsentValue>).detail;
      setEnabled(Boolean(consent?.analytics));
    }

    window.addEventListener("pulsetap-cookie-consent-changed", updateConsent);
    return () => window.removeEventListener("pulsetap-cookie-consent-changed", updateConsent);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${clarityProjectId}");
      `}
    </Script>
  );
}
