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
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 md:p-8 font-sans">
      {/* Main Container */}
      <div className="w-full max-w-[1100px] bg-[#6D28D9] rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative min-h-[600px]">
        
        {/* Decorative Shapes */}
        <div className="absolute top-10 right-[30%] text-purple-300 opacity-50"><Zap size={24} /></div>
        <div className="absolute bottom-10 right-10 text-orange-400 opacity-60"><div className="w-4 h-4 rounded-full border-2 border-orange-400" /></div>
        <div className="absolute bottom-20 left-[40%] text-purple-300 opacity-30"><div className="w-3 h-3 rounded-full bg-purple-300" /></div>

        {/* Left Side: Content & Hero */}
        <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col relative overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white p-1.5 rounded-lg shadow-md">
              <BarChart3 className="text-[#6D28D9] w-6 h-6" />
            </div>
            <h2 className="text-white text-3xl font-extrabold tracking-tight">VyaparBook</h2>
          </div>
          <p className="text-purple-100 text-sm mb-12 font-medium opacity-80">A Dashboard to manage all Your Logistic needs</p>

          {/* Hero Image Container */}
          <div className="relative mt-auto flex justify-center items-end h-full max-h-[400px]">
            <img 
              src="/images/login-hero.png" 
              alt="Professional using laptop" 
              className="w-full h-full object-contain object-bottom transform scale-110 translate-y-4"
            />
            
            {/* Floating Info Cards */}
            <div className="absolute top-[10%] left-[-5%] bg-white rounded-xl p-3 shadow-lg flex items-center gap-3 animate-bounce shadow-purple-900/20">
              <div className="bg-purple-100 p-2 rounded-lg text-[#6D28D9]"><Zap size={18} /></div>
              <div className="pr-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">Smart</p>
                <p className="text-xs text-gray-900 font-extrabold leading-tight">Platform</p>
              </div>
            </div>

            <div className="absolute top-[45%] right-[-5%] bg-white rounded-xl p-3 shadow-lg flex items-center gap-3 shadow-purple-900/20">
              <div className="bg-orange-50 p-2 rounded-lg text-orange-500"><ShieldCheck size={18} /></div>
              <div className="pr-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">Dedicated</p>
                <p className="text-xs text-gray-900 font-extrabold leading-tight">Kam</p>
              </div>
            </div>

            <div className="absolute bottom-[15%] left-[5%] bg-white rounded-xl p-3 shadow-lg flex items-center gap-3 shadow-purple-900/20">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-500"><Loader2 size={18} /></div>
              <div className="pr-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">Real Time</p>
                <p className="text-xs text-gray-900 font-extrabold leading-tight">Operation</p>
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
          <div className="bg-white w-full rounded-[48px] p-8 md:p-10 shadow-xl flex flex-col">
            <h3 className="text-[#4B2A85] text-3xl font-extrabold mb-1">Welcome Back...</h3>
            <p className="text-purple-400 text-sm mb-8 font-semibold">Please enter your email and password</p>

            {error && (
              <div className="mb-4 px-4 py-2 bg-red-50 border border-red-100 text-red-500 text-xs rounded-lg font-medium">{error}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-[#4B2A85] text-sm font-bold mb-2 ml-1">Email</label>
                <input 
                  type="text" 
                  placeholder="Enter your email address"
                  {...register("identifier")}
                  className={`w-full px-5 py-3.5 rounded-2xl bg-gray-50 border ${errors.identifier ? "border-red-400" : "border-gray-100"} text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-gray-300 font-medium`}
                />
              </div>

              <div>
                <label className="block text-[#4B2A85] text-sm font-bold mb-2 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPw ? "text" : "password"} 
                    placeholder="****************"
                    {...register("password")}
                    className={`w-full px-5 py-3.5 rounded-2xl bg-gray-50 border ${errors.password ? "border-red-400" : "border-gray-100"} text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-gray-300 font-medium`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPw(!showPw)} 
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-500 transition-colors"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input type="checkbox" className="w-4 h-4 rounded-md border-gray-300 text-[#6D28D9] focus:ring-[#6D28D9]" id="terms" />
                <label htmlFor="terms" className="text-[11px] text-gray-400 font-bold">
                  By login, you agree to our <span className="text-purple-500 underline cursor-pointer">Terms & Conditions</span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-purple-200 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Login..... <ArrowRight size={18} /></>}
                </button>
                <Link href="/forgot-password">
                  <a className="text-[#4B2A85] text-xs font-extrabold hover:underline">Forget Password?</a>
                </Link>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400 font-bold tracking-tight">
                Don't have an account yet? <Link href="/register"><a className="text-[#6D28D9] font-extrabold hover:underline">Create Account</a></Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

