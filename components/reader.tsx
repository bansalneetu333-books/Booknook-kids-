"use client";

import { useEffect, useRef, useState } from "react";

type EpubReaderProps = {
  bookId: string;
  title: string;
};

type ReaderAccess = {
  epubUrl: string;
  progress: {
    location: string;
    progressPercentage: number;
    lastReadAt: string | null;
  } | null;
};

export function EpubReader({
  bookId,
  title,
}: EpubReaderProps) {
  const readerRef = useRef<HTMLDivElement | null>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentProgress, setCurrentProgress] = useState(0);
  const [pageLabel, setPageLabel] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function startReader() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/reader/access?bookId=${encodeURIComponent(bookId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to open this book."
          );
        }

        if (!data?.epubUrl) {
          throw new Error(
            "A readable version of this book is not available."
          );
        }

        if (cancelled || !readerRef.current) return;

        /*
         * epubjs does not provide TypeScript declarations in this
         * project, so it is loaded dynamically in the browser.
         */
        // @ts-ignore
        const epubModule = await import("epubjs");

        if (cancelled || !readerRef.current) return;

        const ePub = epubModule.default || epubModule;

        const book = ePub(data.epubUrl);

        bookRef.current = book;

        const rendition = book.renderTo(
          readerRef.current,
          {
            width: "100%",
            height: "100%",
            spread: "none",
            flow: "paginated",
          }
        );

        renditionRef.current = rendition;

        /*
         * Restore the customer's previous reading position.
         */
        const savedLocation =
          data?.progress?.location || undefined;

        await rendition.display(savedLocation);

        if (cancelled) return;

        /*
         * Generate locations so we can calculate an approximate
         * reading percentage.
         */
        try {
          await book.locations.generate(1000);
        } catch {
          // Percentage calculation is optional.
        }

        /*
         * Update progress whenever the reader moves.
         */
        rendition.on("relocated", async (location: any) => {
          if (cancelled) return;

          const cfi =
            location?.start?.cfi ||
            location?.start?.href ||
            "";

          if (!cfi) return;

          let percentage = 0;

          try {
            if (
              book.locations &&
              typeof book.locations.percentageFromCfi ===
                "function"
            ) {
              percentage =
                book.locations.percentageFromCfi(cfi) * 100;
            }
          } catch {
            percentage = 0;
          }

          percentage = Math.max(
            0,
            Math.min(100, Math.round(percentage))
          );

          setCurrentProgress(percentage);

          const displayed =
            location?.start?.displayed;

          if (displayed?.page && displayed?.total) {
            setPageLabel(
              `Page ${displayed.page} of ${displayed.total}`
            );
          } else {
            setPageLabel("");
          }

          /*
           * Avoid sending a request for every tiny navigation event.
           */
          if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
          }

          saveTimerRef.current = setTimeout(
            async () => {
              try {
                await fetch("/api/reader/progress", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    bookId,
                    location: cfi,
                    progressPercentage: percentage,
                  }),
                });
              } catch {
                /*
                 * Reading should continue even if progress saving
                 * temporarily fails.
                 */
              }
            },
            700
          );
        });

        setCurrentProgress(
          data?.progress?.progressPercentage || 0
        );

        setLoading(false);
      } catch (err) {
        if (cancelled) return;

        console.error("EPUB reader error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to open the book."
        );

        setLoading(false);
      }
    }

    startReader();

    return () => {
      cancelled = true;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      try {
        renditionRef.current?.destroy?.();
      } catch {
        // Ignore reader cleanup errors.
      }

      try {
        bookRef.current?.destroy?.();
      } catch {
        // Ignore book cleanup errors.
      }

      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [bookId]);

  async function goPrevious() {
    try {
      await renditionRef.current?.prev();
    } catch (err) {
      console.error("Previous page error:", err);
    }
  }

  async function goNext() {
    try {
      await renditionRef.current?.next();
    } catch (err) {
      console.error("Next page error:", err);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-3 pb-6 sm:px-5">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        {/* Reader header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold text-slate-900 sm:text-lg">
              {title}
            </h1>

            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span>
                {currentProgress}% read
              </span>

              {pageLabel && (
                <>
                  <span>•</span>
                  <span>{pageLabel}</span>
                </>
              )}
            </div>
          </div>

          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100 sm:w-40">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{
                width: `${currentProgress}%`,
              }}
            />
          </div>
        </div>

        {/* Reader */}
        <div className="relative h-[70vh] min-h-[500px] bg-slate-100">
          <div
            ref={readerRef}
            className="h-full w-full overflow-hidden"
          />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

                <p className="font-semibold text-slate-700">
                  Opening your book…
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Please wait a moment.
                </p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 p-6">
              <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
                <div className="text-5xl">📖</div>

                <h2 className="mt-4 text-xl font-extrabold text-slate-900">
                  Unable to open the book
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-6 rounded-full bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white p-4">
          <button
            type="button"
            onClick={goPrevious}
            disabled={loading || !!error}
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="hidden text-xs font-medium text-slate-400 sm:block">
            Your reading progress is saved automatically
          </span>

          <button
            type="button"
            onClick={goNext}
            disabled={loading || !!error}
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}

export default EpubReader;
