import React, { useState } from 'react';
import { useAuth } from "../../../../context/AuthContext.jsx";
import { authAPI } from "../../../../shared/api";
import { useNavigate } from "react-router-dom";

export default function MobileSignin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authAPI.login({ email, password });
      login(res.user, res.token);
      navigate("/genaral/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 pt-12">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            K
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
          <p className="text-sm text-zinc-500">Sign in to continue to KeepLynk</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-zinc-900 text-white rounded-lg px-4 py-3.5 font-medium hover:bg-zinc-800 active:bg-zinc-950 transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign in'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="p-6 pb-8">
        <div className="text-center">
          <p className="text-sm text-zinc-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-zinc-900 font-medium underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
