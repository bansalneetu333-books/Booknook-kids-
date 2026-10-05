import { Suspense } from "react";
import AdminLoginForm from "./admin-login-form";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><p>Loading admin login...</p></main>}>
      <AdminLoginForm />
    </Suspense>
  );
}
