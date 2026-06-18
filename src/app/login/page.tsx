"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Code2, Github, Mail, Lock, User, ArrowRight, Sparkles, Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync state with URL query parameter ?signup=true
  useEffect(() => {
    if (searchParams.get("signup") === "true") {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (isSignUp && !username) {
      setError("Please choose a username.");
      setLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        email,
        password,
        username,
        isSignUp: isSignUp ? "true" : "false",
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Sign in successful! Redirect.
        // If it's a new sign up, direct to profile setup
        if (isSignUp) {
          router.push("/profile/setup");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setError(null);
    setLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/profile/setup" });
    } catch (err) {
      setError(`Failed to authenticate with ${provider}.`);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8 text-center">
        <Link href="/" className="flex items-center space-x-2 mb-4 group">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition duration-300">
            <Code2 className="h-7 w-7 text-white" />
          </div>
        </Link>
        <h2 className="text-3xl font-black text-white tracking-tight">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-sm text-slate-400 mt-2">
          {isSignUp 
            ? "Join peers and start solving algorithms collaboratively" 
            : "Sign in to enter your collaborative debug room"
          }
        </p>
      </div>

      {/* Card */}
      <div className="bg-slate-900/40 border border-slate-900 backdrop-blur-md rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-300 flex items-start space-x-2 animate-shake">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="coder_42"
                className="w-full px-4 h-11 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 h-11 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 h-11 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 h-11 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isSignUp ? "Sign Up" : "Sign In"}{" "}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <span className="absolute inset-x-0 top-1/2 border-t border-slate-800 -z-10" />
          <span className="bg-slate-950 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Or Continue With
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 h-11 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900/60 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 disabled:opacity-50"
          >
            {/* Google Icon SVG */}
            <svg className="h-4 w-4 mr-2 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.18 4.114-3.468 0-6.277-2.81-6.277-6.278 0-3.468 2.81-6.277 6.277-6.277 1.55 0 2.96.564 4.062 1.498L21 4.542C18.82 2.68 15.86 1.5 12.24 1.5 6.42 1.5 1.7 6.22 1.7 12s4.72 10.5 10.54 10.5c5.84 0 10.28-4.1 10.28-10.45 0-.58-.06-1.12-.17-1.765H12.24Z"
              />
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 h-11 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900/60 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 disabled:opacity-50"
          >
            <Github className="h-4 w-4 mr-2 text-slate-300" />
            GitHub
          </button>
        </div>
      </div>

      {/* Switch Form Trigger */}
      <div className="text-center mt-6 text-sm text-slate-400">
        {isSignUp ? (
          <span>
            Already have an account?{" "}
            <button
              onClick={() => {
                setError(null);
                setIsSignUp(false);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Sign In
            </button>
          </span>
        ) : (
          <span>
            New to DSA Debug Room?{" "}
            <button
              onClick={() => {
                setError(null);
                setIsSignUp(true);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Create Account
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 relative">
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <Suspense fallback={
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="text-sm text-slate-400 font-medium">Loading session parameters...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
