"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ePub, { type Book, type Rendition } from "epubjs";

type TocEntry = { label: string; href: string; subitems?: TocEntry[] };
type ReaderLocation = { cfi: string | null; percentage: number };

export type UniversalEpubReaderProps = {
  /** A same-origin authenticated endpoint or an EPUB URL the current user may access. */
  src: string;
  title?: string;
  initialCfi?: string | null;
  onLocationChange?: (location: ReaderLocation) => void;
  backHref?: string;
  className?: string;
};

const control =
  "min-h-10 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40";

function flattenToc(items: TocEntry[], depth = 0): Array<TocEntry & { depth: number }> {
  return items.flatMap((item) => [
    { ...item, depth },
    ...flattenToc(item.subitems ?? [], depth + 1),
  ]);
}

/**
 * Orientation- and layout-aware EPUB reader.
 * epub.js reads the EPUB metadata; this component never forces a portrait ratio.
 * Supports reflowable text, fixed-layout illustrations, portrait and landscape EPUBs.
 */
export default function UniversalEpubReader({
  src,
  title = "Your e-book",
  initialCfi = null,
  onLocationChange,
  backHref,
  className = "",
}: UniversalEpubReaderProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const callbackRef = useRef(onLocationChange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toc, setToc] = useState<Array<TocEntry & { depth: number }>>([]);
  const [showToc, setShowToc] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    callbackRef.current = onLocationChange;
  }, [onLocationChange]);

  const resizeRendition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !renditionRef.current) return;
    const { width, height } = stage.getBoundingClientRect();
    if (width > 0 && height > 0) {
      renditionRef.current.resize(Math.floor(width), Math.floor(height));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    let resizeHandler: (() => void) | undefined;
    let book: Book | null = null;
    let rendition: Rendition | null = null;

    async function openBook() {
      setLoading(true);
      setError("");
      setToc([]);
      const stage = stageRef.current;
      if (!stage) return;

      try {
        // Fetch bytes explicitly to produce clearer HTTP errors and avoid
        // epub.js cross-origin fetch surprises on mobile Safari.
        const response = await fetch(src, { cache: "no-store" });
        if (!response.ok) throw new Error(`Book file request failed (HTTP ${response.status}).`);
        const bytes = await response.arrayBuffer();
        if (!bytes.byteLength) throw new Error("The EPUB file is empty.");
        if (cancelled) return;

        book = ePub(bytes);
        bookRef.current = book;
        await book.ready;
        if (cancelled) return;

        rendition = book.renderTo(stage, {
          width: Math.max(1, stage.clientWidth),
          height: Math.max(1, stage.clientHeight),
          flow: "paginated",
          manager: "default",
          spread: "auto",
          minSpreadWidth: 760,
          allowScriptedContent: false,
          resizeOnOrientationChange: true,
        });
        renditionRef.current = rendition;

        rendition.themes.default({
          body: { "overflow-wrap": "break-word" },
          "img, svg, video": { "max-width": "100%" },
        });

        rendition.on("relocated", (location: any) => {
          if (cancelled) return;
          const cfi = location?.start?.cfi ?? null;
          const displayed = location?.start?.displayed;
          const percent =
            displayed?.total > 0
              ? ((displayed.page || 1) / displayed.total) * 100
              : 0;
          const safePercent = Math.round(Math.max(0, Math.min(100, percent)));
          setProgress(safePercent);
          callbackRef.current?.({ cfi, percentage: safePercent });
        });

        const navigation = await book.loaded.navigation;
        if (!cancelled) setToc(flattenToc((navigation?.toc ?? []) as TocEntry[]));

        const resize = () => {
          if (cancelled) return;
          resizeRendition();
        };
        if (typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(resize);
          observer.observe(stage);
        } else {
          resizeHandler = resize;
          window.addEventListener("resize", resizeHandler);
          window.addEventListener("orientationchange", resizeHandler);
        }

        await rendition.display(initialCfi || undefined);
        if (!cancelled) setLoading(false);
        requestAnimationFrame(resize);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Unable to open this EPUB.");
          setLoading(false);
        }
      }
    }

    void openBook();
    return () => {
      cancelled = true;
      observer?.disconnect();
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        window.removeEventListener("orientationchange", resizeHandler);
      }
      try { rendition?.destroy(); } catch {}
      try { book?.destroy(); } catch {}
      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [src, initialCfi, resizeRendition]);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`);
  }, [fontSize]);

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  async function toggleFullscreen() {
    const target = stageRef.current?.parentElement;
    if (!target) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await target.requestFullscreen();
    } catch {
      setError("Fullscreen is not available in this browser.");
    }
  }

  function goTo(href: string) {
    void renditionRef.current?.display(href);
    setShowToc(false);
  }

  return (
    <section className={`flex h-[min(82dvh,1000px)] min-h-[420px] flex-col overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl ${className}`} aria-label={`Reader: ${title}`}>
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-3 py-3 sm:px-5">
        {backHref && <a className={control} href={backHref}>← Back</a>}
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold" title={title}>{title}</h2>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full bg-teal-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-xs text-white/70">{progress}%</span>
      </header>

      <nav className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3" aria-label="Reader controls">
        <button className={control} type="button" disabled={loading} onClick={() => setShowToc((v) => !v)} aria-expanded={showToc}>Contents</button>
        <button className={control} type="button" disabled={loading} onClick={() => void renditionRef.current?.prev()}>← Previous</button>
        <button className={`${control} bg-teal-700`} type="button" disabled={loading} onClick={() => void renditionRef.current?.next()}>Next →</button>
        <span className="flex-1" />
        <button className={control} type="button" disabled={loading || fontSize <= 80} onClick={() => setFontSize((v) => Math.max(80, v - 10))} aria-label="Decrease text size">A−</button>
        <button className={control} type="button" disabled={loading || fontSize >= 180} onClick={() => setFontSize((v) => Math.min(180, v + 10))} aria-label="Increase text size">A+</button>
        <button className={control} type="button" onClick={() => void toggleFullscreen()}>{fullscreen ? "Exit fullscreen" : "Fullscreen"}</button>
      </nav>

      {showToc && <aside className="max-h-48 overflow-auto border-b border-white/10 bg-slate-900 p-2" aria-label="Table of contents">
        {toc.length ? toc.map((item, index) => <button key={`${item.href}-${index}`} type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10" style={{ paddingLeft: 12 + item.depth * 18 }} onClick={() => goTo(item.href)}>{item.label}</button>) : <p className="p-3 text-sm text-white/70">No table of contents is available for this book.</p>}
      </aside>}

      <div className="relative min-h-0 flex-1 bg-white">
        <div ref={stageRef} className="h-full w-full overflow-hidden bg-white" />
        {loading && <div role="status" className="absolute inset-0 grid place-items-center bg-white p-6 text-center text-slate-900">
          <div><div className="text-4xl">📖</div><p className="mt-3 font-bold">Opening your e-book…</p><p className="mt-1 text-sm text-slate-500">Preparing the pages for your screen.</p></div>
        </div>}
        {!loading && error && <div role="alert" className="absolute inset-0 grid place-items-center bg-white p-6 text-center text-slate-900">
          <div><div className="text-4xl">📘</div><p className="mt-3 font-bold">Unable to open this e-book</p><p className="mt-2 max-w-lg text-sm text-slate-600">{error}</p><button className="mt-4 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white" type="button" onClick={() => window.location.reload()}>Try again</button></div>
        </div>}
      </div>
      <footer className="border-t border-white/10 px-4 py-2 text-center text-xs text-white/60">Reading position is available through the onLocationChange callback.</footer>
    </section>
  );
}
