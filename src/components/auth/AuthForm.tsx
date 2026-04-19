"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface AuthFormProps {
  mode: "login" | "signup";
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

const initialState = { error: "" };

export default function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await action(formData);
      return result ?? initialState;
    },
    initialState
  );

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center px-6">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/6 rounded-full blur-3xl" />
      </div>

      <div className="animate-in relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-6">
            <img src="/logo.svg" alt="ApexCard" className="w-9 h-9" />
            <span className="font-bold text-xl tracking-tight text-[#f0f2f8]">ApexCard</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#f0f2f8] tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            {isLogin ? "Sign in to your dashboard" : "Start your 14-day free trial"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-8">
          <form action={formAction} className="space-y-5">
            {!isLogin && (
              <div>
                <label htmlFor="full_name" className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Alex Johnson"
                  className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                  Password
                </label>
                {isLogin && (
                  <Link href="/auth/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </Link>
                )}
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder={isLogin ? "••••••••" : "Min. 8 characters"}
                minLength={8}
                className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {state?.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-xs text-red-400">{state.error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="md" loading={isPending}>
              {isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-[#6b7280] mt-6">
          {isLogin ? (
            <>Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Sign up free
              </Link>
            </>
          ) : (
            <>Already have an account?{" "}
              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
