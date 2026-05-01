import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowRight, Loader2, Send, ShieldCheck, Zap, BarChart3, User, Mail, Phone, Lock } from "lucide-react";
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

export default function Register() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [, navigate] = useLocation();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (data) => {
    dispatch(clearError());
    const { confirmPassword, ...payload } = data;
    dispatch(registerUser(payload)).unwrap().then(() => {
      navigate("/login?registered=true");
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8 font-sans">
      {/* Main Container */}
      <div className="w-full max-w-[1100px] bg-primary rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative min-h-[700px] border border-primary/20">
        
        {/* Decorative Shapes */}
        <div className="absolute top-10 right-[30%] text-primary-foreground/50"><Zap size={24} /></div>
        <div className="absolute bottom-10 right-10 text-primary-foreground/30"><div className="w-4 h-4 rounded-full border-2 border-current" /></div>

        {/* Left Side: Content & Hero */}
        <div className="w-full md:w-[50%] p-8 md:p-12 flex flex-col relative overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary-foreground p-1.5 rounded-lg shadow-md">
              <BarChart3 className="text-primary w-6 h-6" />
            </div>
            <h2 className="text-primary-foreground text-3xl font-extrabold tracking-tight">VyaparBook</h2>
          </div>
          <p className="text-primary-foreground/80 text-sm mb-8 font-medium">Join us to manage all Your Logistic needs</p>

          {/* Hero Image Container */}
          <div className="relative mt-auto flex justify-center items-end h-full max-h-[450px]">
            <img 
              src="/images/login-hero.png" 
              alt="Professional using laptop" 
              className="w-full h-full object-contain object-bottom transform scale-110 translate-y-4"
            />
            
            {/* Floating Info Cards */}
            <div className="absolute top-[10%] left-[-5%] glass rounded-xl p-3 shadow-lg flex items-center gap-3 animate-pulse">
              <div className="bg-primary/20 p-2 rounded-lg text-primary-foreground"><Zap size={18} /></div>
              <div className="pr-2">
                <p className="text-[10px] text-primary-foreground/50 font-bold uppercase leading-tight">Fast</p>
                <p className="text-xs text-primary-foreground font-extrabold leading-tight">Setup</p>
              </div>
            </div>

            <div className="absolute bottom-[20%] left-[5%] glass rounded-xl p-3 shadow-lg flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg text-primary-foreground"><ShieldCheck size={18} /></div>
              <div className="pr-2">
                <p className="text-[10px] text-primary-foreground/50 font-bold uppercase leading-tight">Secure</p>
                <p className="text-xs text-primary-foreground font-extrabold leading-tight">Storage</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="w-full md:w-[50%] bg-transparent p-4 md:p-8 flex items-center justify-center relative">
          <div className="bg-card w-full rounded-[48px] p-8 md:p-10 shadow-xl flex flex-col overflow-y-auto max-h-[90vh] border border-border/50">
            <h3 className="text-foreground text-3xl font-black mb-1 tracking-tight">Create Account</h3>
            <p className="text-muted-foreground text-sm mb-6 font-semibold uppercase tracking-tight">Join the ecosystem</p>

            {error && (
              <div className="mb-4 px-4 py-2 bg-red-50 border border-red-100 text-red-500 text-xs rounded-lg font-medium">{error}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">First Name</label>
                  <input 
                    type="text" 
                    placeholder="John"
                    {...register("firstName")}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-foreground text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Doe"
                    {...register("lastName")}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Email</label>
                <input 
                  type="email" 
                  placeholder="john@example.com"
                  {...register("email")}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-foreground text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Phone</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none border-r border-border pr-3">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">IND</span>
                    <span className="text-sm font-bold text-foreground">+91</span>
                  </div>
                  <input 
                    type="tel" 
                    placeholder="98765 43210"
                    {...register("phone", {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      }
                    })}
                    className="input pl-20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPw ? "text" : "password"} 
                    placeholder="••••••••"
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

              <div>
                <label className="block text-foreground text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className="input"
                />
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary w-full py-3.5"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight size={18} /></>}
                </button>
                <div className="text-center border-t border-border pt-4">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                    Already registered? <Link href="/login"><a className="text-primary hover:underline">Sign In</a></Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

