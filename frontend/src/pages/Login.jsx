import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowRight, Loader2, Send, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { loginUser, clearError } from "../redux/slices/authSlice";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [, navigate] = useLocation();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = (data) => {
    dispatch(clearError());
    dispatch(loginUser(data)).unwrap().then(() => {
      navigate("/");
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8 font-sans">
      {/* Main Container */}
      <div className="w-full max-w-[1100px] bg-primary rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative min-h-[600px] border border-primary/20">
        
        {/* Decorative Shapes */}
        <div className="absolute top-10 right-[30%] text-primary-foreground/50"><Zap size={24} /></div>
        <div className="absolute bottom-10 right-10 text-primary-foreground/30"><div className="w-4 h-4 rounded-full border-2 border-current" /></div>
        <div className="absolute bottom-20 left-[40%] text-primary-foreground/20"><div className="w-3 h-3 rounded-full bg-current" /></div>

        {/* Left Side: Content & Hero */}
        <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col relative overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary-foreground p-1.5 rounded-lg shadow-md">
              <BarChart3 className="text-primary w-6 h-6" />
            </div>
            <h2 className="text-primary-foreground text-3xl font-extrabold tracking-tight">VyaparBook</h2>
          </div>
          <p className="text-primary-foreground/80 text-sm mb-12 font-medium">A Dashboard to manage all Your Logistic needs</p>

          {/* Hero Image Container */}
          <div className="relative mt-auto flex justify-center items-end h-full max-h-[400px]">
            <img 
              src="/images/login-hero.png" 
              alt="Professional using laptop" 
              className="w-full h-full object-contain object-bottom transform scale-110 translate-y-4"
            />
            
            {/* Floating Info Cards */}
            <div className="absolute top-[10%] left-[-5%] glass rounded-xl p-3 shadow-lg flex items-center gap-3 animate-bounce">
              <div className="bg-primary/20 p-2 rounded-lg text-primary-foreground"><Zap size={18} /></div>
              <div className="pr-2">
                <p className="text-[10px] text-primary-foreground/50 font-bold uppercase leading-tight">Smart</p>
                <p className="text-xs text-primary-foreground font-extrabold leading-tight">Platform</p>
              </div>
            </div>

            <div className="absolute top-[45%] right-[-5%] glass rounded-xl p-3 shadow-lg flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg text-primary-foreground"><ShieldCheck size={18} /></div>
              <div className="pr-2">
                <p className="text-[10px] text-primary-foreground/50 font-bold uppercase leading-tight">Dedicated</p>
                <p className="text-xs text-primary-foreground font-extrabold leading-tight">Reliable</p>
              </div>
            </div>

            <div className="absolute bottom-[15%] left-[5%] glass rounded-xl p-3 shadow-lg flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg text-primary-foreground"><Loader2 size={18} /></div>
              <div className="pr-2">
                <p className="text-[10px] text-primary-foreground/50 font-bold uppercase leading-tight">Real Time</p>
                <p className="text-xs text-primary-foreground font-extrabold leading-tight">Operation</p>
              </div>
            </div>

            {/* Paper Airplane */}
            <div className="absolute top-[20%] right-[10%] animate-pulse">
              <Send className="text-white transform -rotate-45 opacity-80" size={32} />
              <div className="absolute top-0 right-0 w-24 h-24 border-2 border-dashed border-white/20 rounded-full -z-10 transform translate-x-4 translate-y-4" />
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-[45%] bg-transparent p-6 md:p-12 flex items-center justify-center relative">
          <div className="bg-card w-full rounded-[48px] p-8 md:p-10 shadow-xl flex flex-col border border-border/50">
            <h3 className="text-foreground text-3xl font-black mb-1 tracking-tight">Welcome Back...</h3>
            <p className="text-muted-foreground text-sm mb-8 font-semibold uppercase tracking-tight">Enter your credentials</p>

            {error && (
              <div className="mb-4 px-4 py-2 bg-red-50 border border-red-100 text-red-500 text-xs rounded-lg font-medium">{error}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-foreground text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Email / ID</label>
                <input 
                  type="text" 
                  placeholder="Enter your email"
                  {...register("identifier")}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-foreground text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPw ? "text" : "password"} 
                    placeholder="****************"
                    {...register("password")}
                    className="input"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPw(!showPw)} 
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input type="checkbox" className="w-4 h-4 rounded-md border-border bg-background text-primary focus:ring-primary" id="terms" />
                <label htmlFor="terms" className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">
                  I agree to the <span className="text-primary underline cursor-pointer">Terms & Conditions</span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary px-8"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Login <ArrowRight size={18} /></>}
                </button>
                <Link href="/forgot-password">
                  <a className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Forget Password?</a>
                </Link>
              </div>
            </form>

            <div className="mt-8 text-center border-t border-border pt-6">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                No account? <Link href="/register"><a className="text-primary hover:underline">Create Account</a></Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

