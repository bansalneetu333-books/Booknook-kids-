"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ePub, { type Book, type Rendition } from "epubjs";

type ReaderProps = {
  bookId: string;
  title?: string;
};

type AccessResponse = {
  url?: string;
  fileType?: string;
  error?: string;
};

type ProgressResponse = {
  location?: string | null;
  progressPercentage?: number;
  error?: string;
};

export function EpubReader({
  bookId,
  title = "Book",
}: ReaderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const saveTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const saveProgress = useCallback(
    (
      location: string | null,
      percentage: number
    ) => {
      if (!location) return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(
        async () => {
          try {
            await fetch(
              "/api/reader/progress",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  bookId,
                  location,
                  progressPercentage:
                    percentage,
                }),
              }
            );
          } catch {
            // Reading should continue even if
            // saving progress temporarily fails.
          }
        },
        800
      );
    },
    [bookId]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadReader() {
      setLoading(true);
      setError("");
      setPdfUrl(null);

      try {
        if (!containerRef.current) {
          throw new Error(
            "Reader container is unavailable."
          );
        }

        const response = await fetch(
          "/api/reader/access",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              bookId,
            }),
          }
        );

        const data =
          (await response.json()) as AccessResponse;

        if (!response.ok || !data.url) {
          throw new Error(
            data.error ??
              "Unable to open this book."
          );
        }

        if (cancelled) return;

        if (data.fileType === "application/pdf" || data.url.toLowerCase().includes(".pdf")) {
          setPdfUrl(data.url);
          setLoading(false);
          return;
        }

        const book = ePub(data.url);

        bookRef.current = book;

        const rendition = book.renderTo(
          containerRef.current,
          {
            width: "100%",
            height: "100%",
            flow: "paginated",
            spread: "auto",
          }
        );

        renditionRef.current = rendition;

        rendition.on(
          "relocated",
          (location: any) => {
            if (cancelled) return;

            const start =
              location?.start;

            const cfi =
              start?.cfi ?? null;

            const displayed =
              location?.start?.displayed;

            let percentage = 0;

            if (
              displayed &&
              displayed.total > 0
            ) {
              percentage =
                (displayed.page /
                  displayed.total) *
                100;
            }

            if (
              typeof percentage !==
              "number"
            ) {
              percentage = 0;
            }

            percentage = Math.min(
              100,
              Math.max(
                0,
                percentage
              )
            );

            setProgress(
              Math.round(percentage)
            );

            saveProgress(
              cfi,
              percentage
            );
          }
        );

        await book.ready;

        if (cancelled) {
          book.destroy();
          return;
        }

        let initialLocation:
          string | null = null;

        try {
          const progressResponse =
            await fetch(
              `/api/reader/progress?bookId=${encodeURIComponent(
                bookId
              )}`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          if (progressResponse.ok) {
            const progressData =
              (await progressResponse.json()) as ProgressResponse;

            initialLocation =
              progressData.location ??
              null;

            if (
              typeof progressData.progressPercentage ===
              "number"
            ) {
              setProgress(
                Math.round(
                  Math.min(
                    100,
                    Math.max(
                      0,
                      progressData.progressPercentage
                    )
                  )
                )
              );
            }
          }
        } catch {
          // Opening the book does not depend
          // on previously saved progress.
        }

        await rendition.display(
          initialLocation ?? undefined
        );

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to open this book."
        );

        setLoading(false);
      }
    }

    void loadReader();

    return () => {
      cancelled = true;

      if (saveTimerRef.current) {
        clearTimeout(
          saveTimerRef.current
        );
      }

      try {
        renditionRef.current?.destroy();
      } catch {}

      try {
        bookRef.current?.destroy();
      } catch {}

      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [bookId, saveProgress]);

  function goPrevious() {
    void renditionRef.current?.prev();
  }

  function goNext() {
    void renditionRef.current?.next();
  }

  if (pdfUrl) {
    return (
      <section className="flex min-h-[75vh] flex-col overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 text-white sm:px-6">
          <h1 className="truncate font-black">{title}</h1>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-black text-white">Open PDF</a>
        </header>
        <iframe title={title} src={pdfUrl} className="h-[75vh] w-full bg-white" />
      </section>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
        <div className="text-4xl">
          📕
        </div>

        <h2 className="mt-3 text-xl font-black text-red-800">
          Unable to open this book
        </h2>

        <p className="mt-2 text-sm font-medium text-red-700">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
          className="mt-5 rounded-full bg-red-600 px-5 py-3 font-black text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="flex min-h-[75vh] flex-col overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl">

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 text-white sm:px-6">

        <div className="min-w-0">
          <h1 className="truncate font-black">
            {title}
          </h1>

          <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <span className="text-sm font-bold text-white/70">
          {progress}%
        </span>

      </header>

      <div className="relative min-h-0 flex-1 bg-white">

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="text-5xl">
                📖
              </div>

              <p className="mt-3 font-black text-slate-700">
                Opening your book…
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Please wait a moment.
              </p>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="h-[70vh] min-h-[500px] w-full"
        />

      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-white/10 bg-slate-900 p-4">

        <button
          type="button"
          onClick={goPrevious}
          disabled={loading}
          className="rounded-full bg-white/10 px-5 py-3 font-black text-white transition hover:bg-white/20 disabled:opacity-40"
        >
          ← Previous
        </button>

        <span className="hidden text-sm font-bold text-white/50 sm:block">
          Your reading progress is saved automatically
        </span>

        <button
          type="button"
          onClick={goNext}
          disabled={loading}
          className="rounded-full bg-indigo-600 px-5 py-3 font-black text-white transition hover:bg-indigo-500 disabled:opacity-40"
        >
          Next →
        </button>

      </footer>
    </section>
  );
}

export default EpubReader;
