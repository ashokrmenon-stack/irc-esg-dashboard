"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) setErr(error.message); else setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold mb-1">IRC ESG Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">Authorised users only — sign in with the email approved by your admin.</p>
        {sent ? (
          <div className="text-sm text-brand-dark bg-brand-bg border border-brand/30 p-4 rounded">
            Magic link sent to <span className="font-medium">{email}</span>. Click it to sign in. If you don&apos;t receive it, check spam or confirm your email is on the allowlist.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Work email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="firstname.lastname@example.com"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            {err && <div className="text-sm text-red-600">{err}</div>}
            <button type="submit" className="w-full bg-brand hover:bg-brand-dark text-white py-2.5 rounded font-medium text-sm">
              Send magic link
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
