"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ePub, { type Book, type Rendition } from "epubjs";

/**
 * BookNook Kids EPUB reader (single reader used by /reader/[bookId] and the
 * admin preview).
 *
 * Why this file is structured the way it is
 * -----------------------------------------
 * epub.js scales a fixed-layout page with `min(width / pageW, height / pageH)`
 * using the size it is given, and anchors the scaled page to the TOP-LEFT of its
 * iframe. So if the stage is a different shape from the page, the page is
 * both smaller than it could be and pushed into a corner.
 *
 * To make the page as large as possible and centred, we therefore:
 *   1. give the reader the whole screen (fixed, 100dvh, safe-area aware);
 *   2. work out the page's real size (viewport meta / SVG viewBox / image size);
 *   3. size the epub.js stage to exactly the "contain"-fitted page rectangle and
 *      centre that rectangle with CSS, so nothing is cropped, stretched or offset.
 * Zoom enlarges that rectangle inside a natively scrollable container (no CSS
 * transforms), so panning works in every direction.
 */

type ReaderProps = {
  bookId: string;
  title?: string;
  preview?: boolean;
  /** Where the "back" button goes. Defaults to the customer library. */
  backHref?: string;
  backLabel?: string;
  /** Small label next to the title, e.g. "Admin preview". */
  badge?: string;
  /** Initial zoom for contexts such as an admin review of tall fixed-layout pages. */
  initialZoom?: number;
};

type AccessResponse = { url?: string; fileType?: string; error?: string };
type ProgressResponse = {
  location?: string | null;
  progressPercentage?: number;
  error?: string;
};

type PageSize = { width: number; height: number };
type Avail = { w: number; h: number };
type Position = {
  page: number;
  endPage: number;
  total: number;
  atStart: boolean;
  atEnd: boolean;
};

class ReaderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

const ZOOM_STEPS = [1, 1.5, 2, 3];
const SWIPE_MIN_PX = 50;

/* ------------------------------------------------------------------ */
/* Page-size helpers (pure functions)                                  */
/* ------------------------------------------------------------------ */

function positive(value: unknown): number {
  if (typeof value === "string" && value.includes("%")) return 0;
  const n = parseFloat(String(value ?? ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseViewportString(content: string | null | undefined): PageSize | null {
  if (!content) return null;
  const w = positive(content.match(/width\s*=\s*([^,;\s]+)/)?.[1]);
  const h = positive(content.match(/height\s*=\s*([^,;\s]+)/)?.[1]);
  return w > 0 && h > 0 ? { width: w, height: h } : null;
}

/** The page's declared size: <meta name="viewport" content="width=…,height=…">. */
function viewportFromDocument(doc: Document): PageSize | null {
  const meta = doc.querySelector("meta[name='viewport']");
  return parseViewportString(meta?.getAttribute("content"));
}

/** Fallback sizes that are declared in the markup (no layout needed). */
function sizeFromMarkup(doc: Document): PageSize | null {
  const svg = doc.querySelector("svg");
  if (svg) {
    const box = (svg.getAttribute("viewBox") || "")
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (box.length === 4 && box[2] > 0 && box[3] > 0) {
      return { width: box[2], height: box[3] };
    }
    const w = positive(svg.getAttribute("width"));
    const h = positive(svg.getAttribute("height"));
    if (w > 0 && h > 0) return { width: w, height: h };
  }
  const img = doc.querySelector("img");
  if (img) {
    const w = positive(img.getAttribute("width"));
    const h = positive(img.getAttribute("height"));
    if (w > 0 && h > 0) return { width: w, height: h };
  }
  return null;
}

/** Last resort once a page is on screen: use the artwork's real pixel size. */
function sizeFromRenderedContents(contents: any): PageSize | null {
  try {
    const doc: Document | undefined = contents?.document;
    if (!doc) return null;
    const img = doc.querySelector("img");
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      return { width: img.naturalWidth, height: img.naturalHeight };
    }
    // The artwork has not finished loading: its size is not known yet, and the
    // document's own scroll size would be a wrong guess. The caller waits.
    if (img && !img.complete) return null;
    const svg = doc.querySelector("svg");
    const vb = svg?.viewBox?.baseVal;
    if (vb && vb.width > 0 && vb.height > 0) {
      return { width: vb.width, height: vb.height };
    }
    const root = doc.documentElement;
    if (root && root.scrollWidth > 0 && root.scrollHeight > 0) {
      return { width: root.scrollWidth, height: root.scrollHeight };
    }
  } catch {
    // ignore – caller falls back to the stage size
  }
  return null;
}

function sameShape(a: PageSize | null, b: PageSize): boolean {
  if (!a) return false;
  return Math.abs(a.width / a.height - b.width / b.height) < 0.01;
}

/** "contain" fit: the largest page rectangle (or spread) that fits `avail`. */
function fitBox(avail: Avail, page: PageSize | null, columns: number): Avail {
  const w = Math.max(1, avail.w);
  const h = Math.max(1, avail.h);
  if (!page) return { w, h };
  const pageW = page.width * columns;
  const scale = Math.min(w / pageW, h / page.height);
  return {
    w: Math.max(1, Math.floor(pageW * scale)),
    h: Math.max(1, Math.floor(page.height * scale)),
  };
}

/**
 * Tall single pages (comic-style, ~9:16) fitted whole into a wide, short window
 * end up only a few hundred pixels wide, which makes small text unreadable.
 * For those cases only, return a zoom that gives the page a comfortable reading
 * width (it then scrolls vertically; "Fit" still shows the whole page).
 * Portrait screens (phones, tablets) and two-page spreads keep the plain fit.
 */
const COMFORT_PAGE_PX = 720;
const READING_WIDTH_PX = 960;

function readableZoom(avail: Avail, fit: Avail, columns: number): number {
  if (columns > 1 || avail.w <= avail.h * 1.1 || fit.w >= COMFORT_PAGE_PX) return 1;
  const targetW = Math.min(avail.w - 24, READING_WIDTH_PX);
  const zoom = targetW / Math.max(1, fit.w);
  const max = ZOOM_STEPS[ZOOM_STEPS.length - 1];
  return Math.round(Math.min(max, Math.max(1, zoom)) * 100) / 100;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ReaderError(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function EpubReader({
  bookId,
  title = "Book",
  preview = false,
  backHref = "/library",
  backLabel = "Library",
  badge,
  initialZoom = 1,
}: ReaderProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null); // measured, scrollable
  const pageRef = useRef<HTMLDivElement | null>(null); // epub.js renders in here
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  // Where epub.js was last asked to show. Used to put the page back if a resize
  // wipes it before epub.js knows where the reader is (see the resize effect).
  const displayRef = useRef<{ started: boolean; target?: string }>({ started: false });

  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Opening your book…");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [pos, setPos] = useState<Position>({
    page: 1,
    endPage: 1,
    total: 0,
    atStart: true,
    atEnd: false,
  });
  const [percent, setPercent] = useState(0);
  const [zoom, setZoom] = useState(() =>
    ZOOM_STEPS.includes(initialZoom) ? initialZoom : 1
  );
  // Once the reader zooms by hand, never auto-zoom again for this session.
  const userZoomed = useRef(false);
  const [avail, setAvail] = useState<Avail>({ w: 0, h: 0 });
  const [pageSize, setPageSize] = useState<PageSize | null>(null);
  const [spreadAllowed, setSpreadAllowed] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Latest values for callbacks that outlive a render (epub.js events, timers).
  const live = useRef({
    avail,
    pageSize,
    columns: 1,
    zoom,
    rtl,
    isFixed,
  });
  const columns = spreadAllowed && avail.w > avail.h * 1.1 ? 2 : 1;
  live.current = { avail, pageSize, columns, zoom, rtl, isFixed };

  const box = fitBox(avail, isFixed ? pageSize : null, columns);
  const stageW = Math.max(1, Math.round(box.w * zoom));
  const stageH = Math.max(1, Math.round(box.h * zoom));

  /* ---------------- progress saving ---------------- */

  const pendingSave = useRef<{ location: string; percentage: number } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback(
    (keepalive = false) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      const pending = pendingSave.current;
      pendingSave.current = null;
      if (!pending || preview) return;
      try {
        void fetch("/api/reader/progress", {
          method: "POST",
          keepalive,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId,
            location: pending.location,
            progressPercentage: pending.percentage,
          }),
        }).catch(() => undefined);
      } catch {
        // Reading continues even if saving progress fails.
      }
    },
    [bookId, preview]
  );

  const queueSave = useCallback(
    (location: string | null, percentage: number) => {
      if (preview || !location) return;
      pendingSave.current = { location, percentage };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => flushSave(false), 800);
    },
    [flushSave, preview]
  );

  /* ---------------- navigation ---------------- */

  const goPrev = useCallback(() => {
    void renditionRef.current?.prev();
  }, []);
  const goNext = useCallback(() => {
    void renditionRef.current?.next();
  }, []);
  const navRef = useRef({ goPrev, goNext });
  navRef.current = { goPrev, goNext };

  const changeZoom = useCallback((direction: 1 | -1 | 0) => {
    userZoomed.current = true;
    setZoom((current) => {
      if (direction === 0) return 1;
      const index = ZOOM_STEPS.findIndex((z) => z >= current - 0.001);
      const next = Math.min(
        ZOOM_STEPS.length - 1,
        Math.max(0, (index < 0 ? 0 : index) + direction)
      );
      return ZOOM_STEPS[next];
    });
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      // Not permitted by the browser – ignore, the reader already fills the screen.
    }
  }, []);

  /* ---------------- screen / page chrome effects ---------------- */

  // The reader owns the whole screen; stop the page behind it from scrolling.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled));
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Measure the real space available for the page (changes with rotation,
  // browser toolbars, fullscreen, keyboard…).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      setAvail((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    observer?.observe(el);
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
  }, [error, pdfUrl, loading]);

  // Keep epub.js in step with the stage rectangle (and one-/two-page mode).
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition || avail.w <= 0 || avail.h <= 0) return;
    try {
      rendition.spread(columns === 2 ? "auto" : "none", 1);
      rendition.resize(stageW, stageH);
      // epub.js clears the page on screen when it is resized and only redraws it
      // if it already has a reading location. A resize that lands before the
      // first location is reported (typical when the page size is only learnt
      // from the first paint) would otherwise leave a permanently blank stage.
      const known = (rendition as any).location?.start;
      if (displayRef.current.started && !known) {
        void rendition.display(displayRef.current.target).catch(() => undefined);
      }
    } catch {
      // Rendition may be mid-teardown.
    }
  }, [stageW, stageH, columns, avail.w, avail.h]);

  // Open tall fixed-layout pages at a readable width (see readableZoom).
  useEffect(() => {
    if (userZoomed.current || !isFixed || !pageSize || avail.w <= 0) return;
    const fit = fitBox(avail, pageSize, columns);
    const target = Math.max(initialZoom, readableZoom(avail, fit, columns));
    setZoom((current) => (Math.abs(current - target) < 0.01 ? current : target));
  }, [avail, pageSize, isFixed, columns, initialZoom]);

  // After zooming in, start from the middle of the page horizontally.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const id = requestAnimationFrame(() => {
      if (zoom > 1) {
        stage.scrollLeft = Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2);
        stage.scrollTop = 0;
      } else {
        stage.scrollLeft = 0;
        stage.scrollTop = 0;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [zoom]);

  // Flush saved progress when the tab is hidden or the reader unmounts.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flushSave(true);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      flushSave(true);
    };
  }, [flushSave]);

  /* ---------------- load the book ---------------- */

  useEffect(() => {
    let cancelled = false;
    const abort = new AbortController();
    const removers: Array<() => void> = [];

    async function load() {
      setLoading(true);
      setLoadingText("Opening your book…");
      setError(null);
      setPdfUrl(null);
      displayRef.current = { started: false };
      setPageSize(null);
      setSpreadAllowed(false);
      setIsFixed(false);
      setPos({ page: 1, endPage: 1, total: 0, atStart: true, atEnd: false });
      setPercent(0);

      try {
        const target = pageRef.current;
        if (!target) throw new ReaderError("Reader container is unavailable.");

        // 1. Ask the server whether this user may read the book (and what it is).
        const accessResponse = await fetch("/api/reader/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId, preview }),
          signal: abort.signal,
        });
        const access = (await accessResponse.json().catch(() => ({}))) as AccessResponse;
        if (!accessResponse.ok || !access.url) {
          throw new ReaderError(access.error ?? "Unable to open this book.", accessResponse.status);
        }
        if (cancelled) return;

        if (access.fileType === "application/pdf" || access.url.toLowerCase().includes(".pdf")) {
          setPdfUrl(access.url);
          setLoading(false);
          return;
        }

        // 2. Download the protected EPUB through the app (same origin, no signed
        //    URL to expire) and hand epub.js the bytes.
        setLoadingText("Downloading your book…");
        const downloadTimer = setTimeout(() => abort.abort(), 90_000);
        let bytes: ArrayBuffer;
        try {
          const fileResponse = await fetch(
            `/api/reader/file?bookId=${encodeURIComponent(bookId)}&preview=${preview ? "true" : "false"}`,
            { method: "GET", cache: "no-store", signal: abort.signal }
          );
          if (!fileResponse.ok) {
            const body = await fileResponse.json().catch(() => ({}));
            throw new ReaderError(
              body.error || `Unable to download the book file (HTTP ${fileResponse.status}).`,
              fileResponse.status
            );
          }
          bytes = await fileResponse.arrayBuffer();
        } catch (cause) {
          if (cause instanceof ReaderError) throw cause;
          if (cancelled) return;
          throw new ReaderError(
            abort.signal.aborted
              ? "Downloading the book took too long. Please check your connection and try again."
              : "We couldn't download the book. Please check your connection and try again."
          );
        } finally {
          clearTimeout(downloadTimer);
        }
        if (!bytes.byteLength) throw new ReaderError("The book file is empty.");
        // An EPUB is a ZIP archive ("PK\x03\x04"). Anything else (an HTML error
        // page, a truncated upload…) would otherwise leave epub.js waiting for
        // the full timeout before reporting a vague failure.
        const head = new Uint8Array(bytes, 0, Math.min(4, bytes.byteLength));
        if (!(head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04)) {
          throw new ReaderError("This file is not a valid EPUB book.");
        }
        if (cancelled) return;

        // 3. Parse the EPUB package.
        setLoadingText("Preparing the pages…");
        const book = ePub(bytes);
        bookRef.current = book;
        try {
          await withTimeout(
            book.ready,
            20_000,
            "This book did not finish loading. The file may be incomplete or incompatible."
          );
        } catch (cause) {
          if (cause instanceof ReaderError) throw cause;
          throw new ReaderError("This file is not a valid EPUB book.");
        }
        if (cancelled) {
          book.destroy();
          return;
        }

        const anyBook = book as any;
        const packaging = anyBook.packaging ?? anyBook.package;
        const meta = packaging?.metadata ?? {};
        const fixed = meta.layout === "pre-paginated";
        const packageViewport = parseViewportString(meta.viewport);
        const spreadMeta = String(meta.spread || "").toLowerCase();
        const wantsSpreads = fixed && (spreadMeta === "both" || spreadMeta === "landscape");
        const isRtl = String(meta.direction || "").toLowerCase() === "rtl";

        setIsFixed(fixed);
        setSpreadAllowed(wantsSpreads);
        setRtl(isRtl);

        // Fixed-layout pages must declare their size for epub.js to scale them.
        // If a page does not, derive it from the markup *before* it is rendered.
        if (fixed) {
          anyBook.spine?.hooks?.content?.register((doc: Document) => {
            try {
              if (viewportFromDocument(doc)) return;
              const size = sizeFromMarkup(doc) ?? packageViewport;
              if (!size) return;
              let tag = doc.querySelector("meta[name='viewport']");
              if (!tag) {
                tag = doc.createElementNS(doc.documentElement.namespaceURI, "meta");
                tag.setAttribute("name", "viewport");
                (doc.querySelector("head") ?? doc.documentElement).appendChild(tag);
              }
              tag.setAttribute("content", `width=${size.width}, height=${size.height}`);
            } catch {
              // never block rendering on a metadata nicety
            }
          });

          // Learn the real page size up front so the very first paint is right.
          try {
            const first = anyBook.spine?.get?.(0);
            const root = first
              ? await withTimeout<Element>(first.load(book.load.bind(book)), 8_000, "timeout")
              : null;
            const doc: Document | undefined = root?.ownerDocument;
            const size = (doc && (viewportFromDocument(doc) ?? sizeFromMarkup(doc))) || packageViewport;
            if (size && !cancelled) {
              live.current.pageSize = size;
              setPageSize(size);
            }
          } catch {
            // Fall back to measuring after the first page renders.
          }
        }
        if (cancelled) return;

        // 4. Render. The stage is exactly the "contain"-fitted page rectangle.
        const L = live.current;
        const cols = wantsSpreads && L.avail.w > L.avail.h * 1.1 ? 2 : 1;
        const firstBox = fitBox(L.avail, fixed ? L.pageSize : null, cols);
        const rendition = book.renderTo(target, {
          width: Math.max(1, Math.round(firstBox.w * L.zoom)),
          height: Math.max(1, Math.round(firstBox.h * L.zoom)),
          flow: "paginated",
          manager: "default",
          spread: cols === 2 ? "auto" : "none",
          minSpreadWidth: 1,
          allowScriptedContent: false,
          resizeOnOrientationChange: false, // we resize from our own measurements
        });
        renditionRef.current = rendition;
        const anyRendition = rendition as any;

        // Safety net: if a page is on screen but still has no usable size,
        // measure its artwork, then re-run epub.js's fit.
        // The hook may return a promise, which epub.js waits for: that is how we
        // give a not-yet-loaded picture time to report its real size.
        const adoptSize = (contents: any): boolean => {
          try {
            const declared = contents.viewport?.() ?? {};
            let width = positive(declared.width);
            let height = positive(declared.height);
            if (!(width > 0 && height > 0)) {
              const measured = sizeFromRenderedContents(contents);
              if (measured) {
                contents.viewport({ width: measured.width, height: measured.height });
                // Re-run epub.js's fit for this page. NB: do not call
                // `rendition.layout()` here – with no argument it re-applies the
                // layout and re-displays the page, which re-fires this hook forever.
                const section = anyBook.spine?.get?.(contents.sectionIndex);
                const layout = anyRendition._layout;
                if (layout?.format) layout.format(contents, section);
                width = measured.width;
                height = measured.height;
              }
            }
            if (width > 0 && height > 0) {
              const size = { width, height };
              if (!sameShape(live.current.pageSize, size)) {
                live.current.pageSize = size;
                setPageSize(size);
              }
              return true;
            }
          } catch {
            // ignore – page keeps epub.js's own fit
          }
          return false;
        };
        anyRendition.hooks?.content?.register((contents: any) => {
          if (!fixed || adoptSize(contents)) return undefined;
          const pending: HTMLImageElement | null | undefined = contents?.document?.querySelector("img");
          if (!pending || pending.complete) return undefined;
          return new Promise<void>((resolve) => {
            const finish = () => {
              window.clearTimeout(timer);
              adoptSize(contents);
              resolve();
            };
            const timer = window.setTimeout(finish, 8_000);
            pending.addEventListener("load", finish, { once: true });
            pending.addEventListener("error", finish, { once: true });
          });
        });

        const total: number =
          anyBook.spine?.length ?? anyBook.spine?.spineItems?.length ?? 0;

        let lastPageIndex = -1;
        rendition.on("relocated", (location: any) => {
          if (cancelled) return;
          const startIndex: number = location?.start?.index ?? 0;
          const endIndex: number = location?.end?.index ?? startIndex;
          // A zoomed page scrolls inside the stage. When the reader moves to a
          // different page, start at its top (not wherever the last one ended).
          if (startIndex !== lastPageIndex) {
            lastPageIndex = startIndex;
            requestAnimationFrame(() => {
              const stage = stageRef.current;
              if (!stage || cancelled) return;
              stage.scrollTop = 0;
              stage.scrollLeft =
                live.current.zoom > 1
                  ? Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2)
                  : 0;
            });
          }
          const displayed = location?.start?.displayed;
          const fraction = fixed
            ? 1
            : displayed?.total > 0
              ? Math.min(1, (displayed.page || 1) / displayed.total)
              : 1;
          const pct = total > 0 ? Math.min(100, Math.max(0, ((startIndex + fraction) / total) * 100)) : 0;
          setPos({
            page: startIndex + 1,
            endPage: endIndex + 1,
            total,
            atStart: Boolean(location?.atStart) || (startIndex === 0 && (displayed?.page ?? 1) <= 1),
            atEnd: Boolean(location?.atEnd),
          });
          setPercent(Math.round(pct));
          queueSave(location?.start?.cfi ?? null, pct);
        });

        // Keyboard (from the page and from the iframe) and swipe (from both).
        const onKey = (event: KeyboardEvent) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          const nav = navRef.current;
          const forward = live.current.rtl ? "ArrowLeft" : "ArrowRight";
          const backward = live.current.rtl ? "ArrowRight" : "ArrowLeft";
          if (event.key === forward || event.key === "PageDown") {
            event.preventDefault();
            nav.goNext();
          } else if (event.key === backward || event.key === "PageUp") {
            event.preventDefault();
            nav.goPrev();
          } else if (event.key === "+" || event.key === "=") {
            changeZoom(1);
          } else if (event.key === "-") {
            changeZoom(-1);
          } else if (event.key === "0") {
            changeZoom(0);
          }
        };
        window.addEventListener("keydown", onKey);
        removers.push(() => window.removeEventListener("keydown", onKey));
        rendition.on("keydown", onKey);

        let swipe: { x: number; y: number; t: number; multi: boolean } | null = null;
        const onTouchStart = (event: TouchEvent) => {
          if (live.current.zoom > 1) {
            swipe = null;
            return;
          }
          const t = event.touches[0];
          swipe = t
            ? { x: t.clientX, y: t.clientY, t: Date.now(), multi: event.touches.length > 1 }
            : null;
        };
        const onTouchEnd = (event: TouchEvent) => {
          const s = swipe;
          swipe = null;
          if (!s || s.multi || live.current.zoom > 1 || event.touches.length > 0) return;
          const t = event.changedTouches[0];
          if (!t) return;
          const dx = t.clientX - s.x;
          const dy = t.clientY - s.y;
          if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
          if (Date.now() - s.t > 800) return;
          const nav = navRef.current;
          const toNext = dx < 0 !== live.current.rtl;
          if (toNext) nav.goNext();
          else nav.goPrev();
        };
        rendition.on("touchstart", onTouchStart);
        rendition.on("touchend", onTouchEnd);
        const stage = stageRef.current;
        if (stage) {
          stage.addEventListener("touchstart", onTouchStart, { passive: true });
          stage.addEventListener("touchend", onTouchEnd, { passive: true });
          removers.push(() => {
            stage.removeEventListener("touchstart", onTouchStart);
            stage.removeEventListener("touchend", onTouchEnd);
          });
        }

        // 5. Resume where the reader left off (never blocks opening the book).
        let initialLocation: string | null = null;
        try {
          const progressResponse = await fetch(
            `/api/reader/progress?bookId=${encodeURIComponent(bookId)}`,
            { method: "GET", cache: "no-store", signal: abort.signal }
          );
          if (progressResponse.ok) {
            const data = (await progressResponse.json()) as ProgressResponse;
            initialLocation = data.location ?? null;
          }
        } catch {
          // ignore
        }
        if (cancelled) return;

        const timeoutMessage = "The reader took too long to show this book. Please try again.";
        // epub.js applies the book's own "rendition:spread" setting when it starts,
        // overriding what renderTo() was given. Left alone, a book that declares
        // spreads would be laid out as two half-width pages even on a portrait
        // phone. Re-assert one-/two-page mode now, before anything is shown.
        try {
          await withTimeout(anyRendition.started as Promise<void>, 10_000, "start");
          const now = live.current;
          const colsNow = wantsSpreads && now.avail.w > now.avail.h * 1.1 ? 2 : 1;
          rendition.spread(colsNow === 2 ? "auto" : "none", 1);
        } catch {
          // The resize effect re-asserts the mode on the next size change.
        }
        if (cancelled) return;
        try {
          displayRef.current = { started: true, target: initialLocation ?? undefined };
          await withTimeout(rendition.display(initialLocation ?? undefined), 15_000, timeoutMessage);
        } catch (cause) {
          if (cancelled) return;
          if (initialLocation && !(cause instanceof ReaderError)) {
            // A saved position from an older version of the book may be invalid.
            displayRef.current = { started: true, target: undefined };
            await withTimeout(rendition.display(), 15_000, timeoutMessage);
          } else {
            throw cause;
          }
        }
        if (cancelled) return;
        setLoading(false);
      } catch (cause) {
        if (cancelled) return;
        const err = cause instanceof ReaderError ? cause : null;
        setError({
          message:
            err?.message ??
            (cause instanceof Error && cause.message
              ? cause.message
              : "Unable to open this book."),
          status: err?.status,
        });
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      abort.abort();
      removers.forEach((remove) => remove());
      try {
        renditionRef.current?.destroy();
      } catch {}
      try {
        bookRef.current?.destroy();
      } catch {}
      renditionRef.current = null;
      bookRef.current = null;
    };
    // `attempt` re-runs the loader for "Try again" without reloading the page.
  }, [bookId, preview, attempt, queueSave, changeZoom]);

  function retry() {
    setError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  }

  /* ---------------- render ---------------- */

  const forwardLabel = rtl ? "←" : "→";
  const backwardLabel = rtl ? "→" : "←";
  const leftIsNext = rtl;
  const pageLabel =
    pos.total > 0
      ? pos.endPage > pos.page
        ? `Pages ${pos.page}–${pos.endPage} of ${pos.total}`
        : `Page ${pos.page} of ${pos.total}`
      : "";
  const zoomPercent = Math.round(zoom * 100);

  const topBar = (
    <header className="bn-reader-bar bn-reader-top">
      <Link href={backHref} className="bn-reader-btn bn-reader-back" aria-label={`Back to ${backLabel}`}>
        <span aria-hidden="true">←</span>
        <span className="bn-reader-back-text">{backLabel}</span>
      </Link>
      <h1 className="bn-reader-title" title={title}>
        {title}
      </h1>
      {badge && <span className="bn-reader-badge">{badge}</span>}
      {!pdfUrl && !error && (
        <div className="bn-reader-tools" role="group" aria-label="Page zoom">
          <button
            type="button"
            className="bn-reader-btn bn-reader-icon"
            onClick={() => changeZoom(-1)}
            disabled={loading || zoom <= 1}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="bn-reader-btn bn-reader-zoomval"
            onClick={() => changeZoom(0)}
            disabled={loading || zoom === 1}
            aria-label={zoom === 1 ? "Page fits the screen" : "Reset zoom to fit the page"}
          >
            {zoom === 1 ? "Fit" : `${zoomPercent}%`}
          </button>
          <button
            type="button"
            className="bn-reader-btn bn-reader-icon"
            onClick={() => changeZoom(1)}
            disabled={loading || zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            aria-label="Zoom in"
          >
            +
          </button>
          {canFullscreen && (
            <button
              type="button"
              className="bn-reader-btn bn-reader-icon"
              onClick={() => void toggleFullscreen()}
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            >
              {fullscreen ? "⤡" : "⤢"}
            </button>
          )}
        </div>
      )}
    </header>
  );

  if (pdfUrl) {
    return (
      <section ref={rootRef} className="bn-reader" aria-label={`Reader: ${title}`}>
        {topBar}
        <div className="bn-reader-stage" style={{ background: "#fff" }}>
          <iframe title={title} src={pdfUrl} style={{ border: 0, width: "100%", height: "100%" }} />
        </div>
        <footer className="bn-reader-bar bn-reader-bottom" style={{ justifyContent: "center" }}>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="bn-reader-btn bn-reader-primary">
            Open PDF in a new tab
          </a>
        </footer>
      </section>
    );
  }

  if (error) {
    const needsLogin = error.status === 401;
    return (
      <section ref={rootRef} className="bn-reader" aria-label={`Reader: ${title}`}>
        {topBar}
        <div className="bn-reader-stage" role="alert">
          <div className="bn-reader-message">
            <div className="bn-reader-emoji" aria-hidden="true">
              {needsLogin ? "🔑" : "📕"}
            </div>
            <h2>{needsLogin ? "Please sign in again" : "We couldn't open this book"}</h2>
            <p>{needsLogin ? "Your session has ended, so we can't open the book yet." : error.message}</p>
            <div className="bn-reader-actions">
              {needsLogin ? (
                <a
                  className="bn-reader-btn bn-reader-primary"
                  href={`/login?next=${encodeURIComponent(`/reader/${bookId}`)}`}
                >
                  Sign in
                </a>
              ) : (
                <button type="button" className="bn-reader-btn bn-reader-primary" onClick={retry}>
                  Try again
                </button>
              )}
              <Link className="bn-reader-btn" href={backHref}>
                Back to {backLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const prevDisabled = loading || (leftIsNext ? pos.atEnd : pos.atStart);
  const nextDisabled = loading || (leftIsNext ? pos.atStart : pos.atEnd);
  const leftAction = leftIsNext ? goNext : goPrev;
  const rightAction = leftIsNext ? goPrev : goNext;

  return (
    <section ref={rootRef} className="bn-reader" aria-label={`Reader: ${title}`}>
      {topBar}

      <div
        ref={stageRef}
        className="bn-reader-stage"
        data-zoomed={zoom > 1 ? "true" : "false"}
        tabIndex={-1}
      >
        <div
          ref={pageRef}
          className="bn-reader-page"
          style={{ width: stageW, height: stageH }}
        />
        {loading && (
          <div className="bn-reader-loading" role="status" aria-live="polite">
            <div className="bn-reader-spinner" aria-hidden="true" />
            <p>{loadingText}</p>
          </div>
        )}
      </div>

      <footer className="bn-reader-bottom">
        <div
          className="bn-reader-progress"
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div style={{ width: `${percent}%` }} />
        </div>
        <div className="bn-reader-bar">
          <button
            type="button"
            className="bn-reader-btn bn-reader-nav"
            onClick={leftAction}
            disabled={leftIsNext ? nextDisabled : prevDisabled}
            aria-label={leftIsNext ? "Next page" : "Previous page"}
          >
            <span aria-hidden="true">{backwardLabel}</span> {leftIsNext ? "Next" : "Previous"}
          </button>
          <span className="bn-reader-pageno" aria-live="polite">
            {pageLabel || (loading ? "" : `${percent}%`)}
          </span>
          <button
            type="button"
            className="bn-reader-btn bn-reader-nav bn-reader-primary"
            onClick={rightAction}
            disabled={leftIsNext ? prevDisabled : nextDisabled}
            aria-label={leftIsNext ? "Previous page" : "Next page"}
          >
            {leftIsNext ? "Previous" : "Next"} <span aria-hidden="true">{forwardLabel}</span>
          </button>
        </div>
      </footer>
    </section>
  );
}

export default EpubReader;
