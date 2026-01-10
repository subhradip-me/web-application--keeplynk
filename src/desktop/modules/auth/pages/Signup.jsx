import React from 'react'
import { useAuth } from "../../../../context/AuthContext.jsx";
import { Register } from "../../shared/api/apiClient";
import { useNavigate } from "react-router-dom";
export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [initialPersona, setInitialPersona] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await Register({ firstName, lastName, email, password, initialPersona: initialPersona || undefined });
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
          <h1 className="text-2xl font-bold text-zinc-900">Sign up for KeepLynk</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-zinc-600 mb-1">First Name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="John" required />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-zinc-600 mb-1">Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="Doe" required />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-600 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="user@example.com" required />
          </div>
          <div>
            <label className="block text-xs text-zinc-600 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="SecurePass123!" required />
          </div>
          <div>
            <label className="block text-xs text-zinc-600 mb-1">Persona <span className="text-zinc-400">(optional)</span></label>
            <select value={initialPersona} onChange={e => setInitialPersona(e.target.value)} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
              <option value="">Select persona</option>
              <option value="student">Student</option>
              <option value="creator">Creator</option>
              <option value="entrepreneur">Entrepreneur</option>
              <option value="professional">Professional</option>
              <option value="researcher">Researcher</option>
            </select>
          </div>
          <button disabled={loading} type="submit" className="w-full bg-zinc-900 text-white rounded px-3 py-2 font-medium hover:bg-zinc-800 transition-colors mt-2">{loading ? 'Signing up...' : 'Sign up'}</button>
        </form>
        <div className="text-xs text-zinc-500 text-center">
          Already have an account? <a href="/signin" className="text-zinc-900 underline">Sign in</a>
        </div>
      </div>
    </div>
  )
}
