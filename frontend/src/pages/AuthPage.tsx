import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { LogIn, UserPlus, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  
  const navigate = useNavigate();
  const setUser = useAppStore(state => state.setUser);
  const setSession = useAppStore(state => state.setSession);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setUser(data.user);
        setSession(data.session);
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        if (data.user) {
          setError("Account created! Please check your email for verification.");
          setIsLogin(true);
          setConfirmPassword('');
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleLoginMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setConfirmPassword('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] p-12 shadow-[0_20px_40px_rgba(0,0,0,0.06)] w-full max-w-md flex flex-col gap-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-surface-tint/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="text-center relative">
          <h1 className="font-headline text-4xl font-extrabold text-slate-900 tracking-tight mb-2">EvalTrack</h1>
          <p className="text-on-surface-variant font-medium text-sm">
            {isLogin ? "Welcome to the Intellectual Sanctuary" : "Join the Academic Excellence"}
          </p>
        </div>

        {error && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl text-sm ${error.includes('check your email') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {error.includes('check your email') ? <Loader2 size={18} className="animate-spin" /> : <AlertCircle size={18} />}
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-4">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Elena Vance"
                className="bg-white/50 border-none rounded-full px-6 py-3.5 text-sm focus:ring-2 focus:ring-surface-tint/20 transition-all placeholder:text-slate-400"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-4">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena.vance@university.edu"
              className="bg-white/50 border-none rounded-full px-6 py-3.5 text-sm focus:ring-2 focus:ring-surface-tint/20 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-4">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/50 border-none rounded-full px-6 py-3.5 pr-12 text-sm focus:ring-2 focus:ring-surface-tint/20 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-4">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/50 border-none rounded-full px-6 py-3.5 pr-12 text-sm focus:ring-2 focus:ring-surface-tint/20 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="text-center relative">
          <button
            onClick={toggleLoginMode}
            className="text-sm font-medium text-surface-tint hover:underline transition-all"
          >
            {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
