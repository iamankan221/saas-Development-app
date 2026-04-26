import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, User, Mail, Phone, Lock, ArrowRight, Loader2, Check, X } from "lucide-react";
import { registerUser, clearError } from "../redux/slices/authSlice";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number").max(20),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please retype your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function PasswordStrength({ password }) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const levels = [
      { label: "", color: "" },
      { label: "Weak", color: "bg-red-500" },
      { label: "Fair", color: "bg-orange-500" },
      { label: "Good", color: "bg-yellow-500" },
      { label: "Strong", color: "bg-green-500" },
      { label: "Very Strong", color: "bg-emerald-500" },
    ];
    return { score, ...levels[score] };
  }, [password]);

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-white/10"}`} />
        ))}
      </div>
      <p className={`text-xs ${strength.score >= 4 ? "text-green-400/80" : strength.score >= 2 ? "text-yellow-400/80" : "text-red-400/80"}`}>{strength.label}</p>
    </div>
  );
}

export default function Register() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [, navigate] = useLocation();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });
  const watchPassword = watch("password");
  const watchConfirm = watch("confirmPassword");

  const onSubmit = (data) => {
    dispatch(clearError());
    const { confirmPassword, ...payload } = data;
    dispatch(registerUser(payload)).unwrap().then(() => {
      // Redirect to login page after successful registration
      navigate("/login?registered=true");
    }).catch(() => {
      // Error is handled by Redux state
    });
  };

  const inputCls = (err) => `w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.06] border ${err ? "border-red-400/50" : "border-white/[0.1]"} text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative w-full max-w-lg mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25 mb-4">
            <span className="text-white font-bold text-xl">VB</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-blue-200/60 text-sm mt-1">Get started with VyaparBook in seconds</p>
        </div>

        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.1] rounded-2xl p-8 shadow-2xl shadow-black/20">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-first" className="block text-sm font-medium text-blue-100/70 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input id="reg-first" type="text" placeholder="John" {...register("firstName")} className={inputCls(errors.firstName)} />
                </div>
                {errors.firstName && <p className="mt-1.5 text-xs text-red-400/80">{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="reg-last" className="block text-sm font-medium text-blue-100/70 mb-2">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input id="reg-last" type="text" placeholder="Doe" {...register("lastName")} className={inputCls(errors.lastName)} />
                </div>
                {errors.lastName && <p className="mt-1.5 text-xs text-red-400/80">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-blue-100/70 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input id="reg-email" type="email" autoComplete="email" placeholder="you@email.com" {...register("email")} className={inputCls(errors.email)} />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400/80">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-medium text-blue-100/70 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input id="reg-phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" {...register("phone")} className={inputCls(errors.phone)} />
              </div>
              {errors.phone && <p className="mt-1.5 text-xs text-red-400/80">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-blue-100/70 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input id="reg-password" type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="Min 6 characters" {...register("password")} className={`w-full pl-11 pr-12 py-3 rounded-xl bg-white/[0.06] border ${errors.password ? "border-red-400/50" : "border-white/[0.1]"} text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors" tabIndex={-1}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400/80">{errors.password.message}</p>}
              <PasswordStrength password={watchPassword} />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-blue-100/70 mb-2">Retype Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input id="reg-confirm" type={showConfirmPw ? "text" : "password"} autoComplete="new-password" placeholder="Retype your password" {...register("confirmPassword")} className={`w-full pl-11 pr-12 py-3 rounded-xl bg-white/[0.06] border ${errors.confirmPassword ? "border-red-400/50" : "border-white/[0.1]"} text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all`} />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors" tabIndex={-1}>
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400/80">{errors.confirmPassword.message}</p>}
              {watchConfirm && !errors.confirmPassword && watchPassword === watchConfirm && (
                <p className="mt-1.5 text-xs text-green-400/80 flex items-center gap-1"><Check className="w-3 h-3" /> Passwords match</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-blue-200/50 mt-6">
          Already have an account?{" "}
          <Link href="/login"><a className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign in</a></Link>
        </p>
      </div>
    </div>
  );
}
