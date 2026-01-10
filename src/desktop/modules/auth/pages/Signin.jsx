import React, { useState } from 'react';
import { useAuth } from "../../../../context/AuthContext.jsx";
import { Login } from "../../shared/api/apiClient";
import { useNavigate } from "react-router-dom";

export default function Signin() {
    const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await Login({ email, password });

      login(res.user, res.token);
      navigate("/student/home");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-xl shadow-sm p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded bg-zinc-900 flex items-center justify-center text-white text-2xl font-bold">K</div>
          <h1 className="text-2xl font-bold text-zinc-900">Sign in to KeepLynk</h1>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs text-zinc-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-600 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="••••••••"
              required
            />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-zinc-900 text-white rounded px-3 py-2 font-medium hover:bg-zinc-800 transition-colors mt-2">{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <div className="text-xs text-zinc-500 text-center">
          Don&apos;t have an account? <a href="/signup" className="text-zinc-900 underline">Sign up</a>
        </div>
      </div>
    </div>
  )
}
