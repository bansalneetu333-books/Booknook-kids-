export async function trackEvent(input: {
  event: "book_view" | "reading_start" | "download" | "search";
  bookId?: string;
  metadata?: Record<string, string>;
}) {
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: input.event,
        bookId: input.bookId ?? null,
        metadata: input.metadata ?? {}
      }),
      keepalive: true
    });
  } catch {
    // Analytics must never block the customer experience.
  }
}
