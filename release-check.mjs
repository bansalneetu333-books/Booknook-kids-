import fs from "node:fs";
import path from "node:path";

const required = [
  "app/api/payments/create-order/route.ts",
  "app/api/payments/verify/route.ts",
  "app/api/payments/webhook/route.ts",
  "app/api/reader/access/route.ts",
  "app/api/downloads/epub/route.ts",
  "app/api/admin/refunds/route.ts",
  "supabase/migrations/0005_hardening.sql",
  "docs/PRODUCTION_RUNBOOK.md"
];

const missing = required.filter((file) => !fs.existsSync(path.resolve(file)));
if (missing.length) {
  console.error("Missing required release files:", missing);
  process.exit(1);
}

const envExample = fs.readFileSync(".env.example", "utf8");
for (const key of [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
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
