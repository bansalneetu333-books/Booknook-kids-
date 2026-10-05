import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><p>Loading sign in...</p></main>}>
      <LoginForm />
    </Suspense>
  );
}
