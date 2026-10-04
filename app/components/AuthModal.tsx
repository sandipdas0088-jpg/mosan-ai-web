"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.user) {
          setMessage(
            "Account created successfully! Please check your email if confirmation is required."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          return;
        }

        setMessage("Login successful!");

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 700);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1020] p-8 shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-2xl text-gray-400 hover:text-white"
        >
          ×
        </button>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">
            <span className="text-cyan-400">Mosan</span> AI
          </h2>

          <p className="mt-3 text-sm text-gray-400">
            {mode === "login"
              ? "Login to continue creating AI prompts"
              : "Create your Mosan AI account"}
          </p>
        </div>

        <div className="mb-6 flex rounded-xl bg-white/5 p-1">
          <button
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-cyan-500 text-black"
                : "text-gray-400"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === "signup"
                ? "bg-cyan-500 text-black"
                : "text-gray-400"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-cyan-400"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300">
            {message}
          </div>
        )}

        <button
          onClick={handleAuth}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-cyan-500 py-3.5 font-bold text-black transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Login"
            : "Create Account"}
        </button>

        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setMessage("");
            }}
            className="ml-2 text-cyan-400 hover:text-cyan-300"
          >
            {mode === "login" ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}