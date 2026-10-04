import fs from "node:fs";

const required = [
  "app/api/checkout/create-order/route.ts",
  "app/api/checkout/verify/route.ts",
  "app/api/webhooks/razorpay/route.ts",
  "app/api/reader/access/route.ts",
  "app/api/books/download/route.ts",
  "app/api/admin/books/route.ts",
  "app/api/admin/books/version/route.ts",
  "app/api/admin/books/version/activate/route.ts",
  "lib/razorpay.ts",
  "lib/admin.ts",
  "lib/storage.ts",
  "middleware.ts",
  "next.config.ts",
  "package.json"
];

const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error("Missing required release files:", missing);
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const script of ["build", "lint", "typecheck", "test", "release-check", "smoke-test"]) {
  if (!packageJson.scripts?.[script]) {
    console.error(`Missing npm script: ${script}`);
    process.exit(1);
  }
}

const envExample = fs.existsSync(".env.example")
  ? fs.readFileSync(".env.example", "utf8")
  : "";

for (const key of [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET"
]) {
  if (!envExample.includes(key)) {
    console.error(`Missing ${key} in .env.example`);
    process.exit(1);
  }
}

console.log("Release file/config checks passed.");
