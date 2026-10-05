"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthSessionKeeper() {
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.startAutoRefresh();

    const refreshWhenActive = async () => {
      if (document.visibilityState !== "visible") return;

      try {
        await supabase.auth.getSession();
      } catch {
        // Middleware will handle a genuinely expired session.
      }
    };

    document.addEventListener("visibilitychange", refreshWhenActive);
    window.addEventListener("focus", refreshWhenActive);
    window.addEventListener("pageshow", refreshWhenActive);

    void refreshWhenActive();

    return () => {
      document.removeEventListener("visibilitychange", refreshWhenActive);
      window.removeEventListener("focus", refreshWhenActive);
      window.removeEventListener("pageshow", refreshWhenActive);
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  return null;
}
