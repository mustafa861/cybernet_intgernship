"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";

const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED"];

function passwordStrength(pw: string): { score: number; label: string; bar: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", bar: "bg-red-500" };
  if (score <= 3) return { score, label: "Medium", bar: "bg-amber-500" };
  return { score, label: "Strong", bar: "bg-green-500" };
}

function strengthLabelClass(score: number): string {
  if (score <= 1) return "text-red-500";
  if (score <= 3) return "text-amber-500";
  return "text-green-500";
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const { register } = useAuth();
  const router = useRouter();

  const strength = useMemo(() => passwordStrength(password), [password]);

  const phoneValid = phone.length === 0 || /^\+?\d+$/.test(phone);
  const passwordsMatch = password === confirmPassword;
  const passwordStrong = strength.score >= 4;
  const canSubmit = !!(businessName && email && phone && phoneValid && passwordStrong && passwordsMatch);

  const missingRequirements: string[] = [];
  if (touched.password || password) {
    if (password.length < 8) missingRequirements.push("8+ characters");
    if (!/[A-Z]/.test(password)) missingRequirements.push("one uppercase");
    if (!/[0-9]/.test(password)) missingRequirements.push("one number");
    if (!/[^A-Za-z0-9]/.test(password)) missingRequirements.push("one special character");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(email, password, businessName, phone, currency);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.error?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Accounting CA</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Get started with AI-powered accounting</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Business / Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Your Business LLC"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className={`input-field ${phone && !phoneValid ? "border-red-400 dark:border-red-500" : ""}`}
            />
            {phone && !phoneValid && (
              <p className="text-xs text-red-500 mt-1">Only digits and an optional + prefix allowed</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Currency <span className="text-red-500">*</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input-field"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                required
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {(touched.password || password) && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.bar : "bg-gray-200 dark:bg-gray-700"}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${strengthLabelClass(strength.score)}`}>
                    {strength.label}
                  </span>
                  {strength.score < 4 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {missingRequirements.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                required
                className={`input-field pr-10 ${confirmPassword && !passwordsMatch ? "border-red-400 dark:border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {(touched.confirmPassword || confirmPassword) && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Account
          </button>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-600 font-medium hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
