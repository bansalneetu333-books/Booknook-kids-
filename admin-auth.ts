import { redirect } from "next/navigation";
import { requireAdmin as checkAdmin } from "@/lib/admin";

export async function requireAdmin() {
  const result = await checkAdmin();
  if (!result.user) redirect("/login?next=/admin");
  if (!result.isAdmin) redirect("/login?next=/admin");
  return result.user;
}
