import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { loginUser, clearError } from "../redux/slices/authSlice";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const justRegistered = new URLSearchParams(searchString).get("registered") === "true";
  const [showPw, setShowPw] = useState(false);
  const [gClicked, setGClicked] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = (data) => {
    dispatch(clearError());
    dispatch(loginUser(data)).unwrap().then(() => {
      navigate("/");
    }).catch(() => {
      // Error handled by Redux
    });
  };
  const handleGoogle = () => { setGClicked(true); setTimeout(() => setGClicked(false), 3000); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25 mb-4">
            <span className="text-white font-bold text-xl">VB</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-blue-200/60 text-sm mt-1">Sign in to your VyaparBook account</p>
        </div>

        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.1] rounded-2xl p-8 shadow-2xl shadow-black/20">
          {justRegistered && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Registration successful! Please sign in with your credentials.
            </div>
          )}

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
          )}

          <button type="button" onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.1] text-white/90 text-sm font-medium hover:bg-white/[0.12] transition-all duration-200">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
          {gClicked && <p className="text-xs text-amber-400/80 text-center mt-2 animate-pulse">Google SSO coming soon</p>}

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/[0.1]" />
            <span className="text-xs text-white/30 uppercase tracking-widest font-medium">or</span>
            <div className="flex-1 h-px bg-white/[0.1]" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="login-identifier" className="block text-sm font-medium text-blue-100/70 mb-2">Email or Phone Number</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input id="login-identifier" type="text" autoComplete="username" placeholder="you@email.com or +91 98765 43210" {...register("identifier")} className={`w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.06] border ${errors.identifier ? "border-red-400/50" : "border-white/[0.1]"} text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all`} />
              </div>
              {errors.identifier && <p className="mt-1.5 text-xs text-red-400/80">{errors.identifier.message}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-blue-100/70 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input id="login-password" type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" {...register("password")} className={`w-full pl-11 pr-12 py-3 rounded-xl bg-white/[0.06] border ${errors.password ? "border-red-400/50" : "border-white/[0.1]"} text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors" tabIndex={-1}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400/80">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-blue-200/50 mt-6">
          Don't have an account?{" "}
          <Link href="/register"><a className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Create one</a></Link>
        </p>
      </div>
    </div>
  );
}
