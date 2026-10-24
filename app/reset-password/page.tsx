
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated successfully. Please log in.");
    setTimeout(() => router.push("/"), 2000);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <form
        onSubmit={handleReset}
        className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <h1 className="text-2xl font-bold">Reset Password</h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password (minimum 6 characters)"
          minLength={6}
          required
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        {message && <p>{message}</p>}
      </form>
    </main>
  );
}
