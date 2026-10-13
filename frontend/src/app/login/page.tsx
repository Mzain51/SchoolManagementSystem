"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, School } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const { error: signInError } = await createClient().auth.signInWithPassword({
        email: String(values.get("email")).trim(),
        password: String(values.get("password")),
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      localStorage.removeItem("sms_auth_token");
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reach Supabase Auth.");
    } finally {
      setBusy(false);
    }
  }

  function useDevelopmentAdmin() {
    localStorage.setItem("sms_auth_token", "dev-token-admin");
    router.replace("/");
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20"><School className="h-6 w-6" /></div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Pakistan SMS</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Sign in to your school</h1>
      <p className="mt-2 text-sm text-slate-500">Use the account issued by your school administrator.</p>
      <form onSubmit={signIn} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Email<input name="email" type="email" autoComplete="username" required className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
        <label className="block text-sm font-medium text-slate-700">Password<input name="password" type="password" autoComplete="current-password" required className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Sign in</button>
      </form>
      {process.env.NODE_ENV === "development" && <div className="mt-5 border-t border-slate-100 pt-4"><button onClick={useDevelopmentAdmin} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Continue with local demo admin</button><p className="mt-2 text-center text-[11px] text-slate-400">Development only. This uses the backend demo-token bypass.</p></div>}
      <p className="mt-6 text-center text-xs text-slate-500"><Link href="/" className="hover:text-blue-600">Return to dashboard</Link></p>
    </section>
  </main>;
}
