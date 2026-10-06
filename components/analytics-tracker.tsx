"use client";

import { useEffect } from "react";

export default function AnalyticsTracker() {
  useEffect(() => {
    const payload = JSON.stringify({
      eventType: "page_view",
      metadata: {
        path: window.location.pathname.slice(0, 300),
      },
    });

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Analytics must never interrupt the customer experience.
    });
  }, []);

  return null;
}
