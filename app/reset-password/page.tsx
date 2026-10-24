
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Verifying reset link...");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyResetLink() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const hashParams = new URLSearchParams(
          url.hash.startsWith("#") ? url.hash.slice(1) : url.hash
        );

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const recoveryError =
          url.searchParams.get("error_description") ||
          hashParams.get("error_description");

        if (recoveryError) {
          throw new Error(recoveryError);
        }

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!data.session) {
          throw new Error(
            "Reset link is invalid or expired. Please request a new password reset email."
          );
        }

        if (active) {
          setReady(true);
          setMessage("");
        }
      } catch (error) {
        if (active) {
          setReady(false);
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not verify reset link. Please request a new one."
          );
        }
      }
    }

    verifyResetLink();

    return () => {
      active = false;
    };
  }, []);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        throw new Error(
          "Reset session missing. Please request a new reset email."
        );
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      await supabase.auth.signOut();

      setMessage("Password updated successfully. Redirecting to login...");

      setTimeout(() => router.push("/"), 2000);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Password reset failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <form
        onSubmit={handleReset}
        className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <h1 className="text-2xl font-bold">Reset Password</h1>

        {ready && (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password (minimum 6 characters)"
              minLength={6}
              required
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-black disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </>
        )}

        {message && (
          <p className="break-words text-sm text-gray-200">{message}</p>
        )}
      </form>
    </main>
  );
}
