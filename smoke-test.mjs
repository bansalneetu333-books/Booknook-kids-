const base = process.env.SMOKE_TEST_URL ?? process.env.NEXT_PUBLIC_SITE_URL;

if (!base) {
  console.error("Set SMOKE_TEST_URL or NEXT_PUBLIC_SITE_URL.");
  process.exit(1);
}

const paths = ["/", "/books", "/sitemap.xml", "/robots.txt", "/api/health"];

let failed = false;

for (const pathname of paths) {
  try {
    const response = await fetch(new URL(pathname, base));
    console.log(`${response.status} ${pathname}`);
    if (response.status >= 500) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAILED ${pathname}`, error);
  }
}

process.exit(failed ? 1 : 0);
