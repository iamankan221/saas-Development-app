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
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 md:p-8 font-sans">
      {/* Main Container */}
      <div className="w-full max-w-[1100px] bg-[#6D28D9] rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative min-h-[700px]">
        
        {/* Decorative Shapes */}
        <div className="absolute top-10 right-[30%] text-purple-300 opacity-50"><Zap size={24} /></div>
        <div className="absolute bottom-10 right-10 text-orange-400 opacity-60"><div className="w-4 h-4 rounded-full border-2 border-orange-400" /></div>

        {/* Left Side: Content & Hero */}
        <div className="w-full md:w-[50%] p-8 md:p-12 flex flex-col relative overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white p-1.5 rounded-lg shadow-md">
              <BarChart3 className="text-[#6D28D9] w-6 h-6" />
            </div>
            <h2 className="text-white text-3xl font-extrabold tracking-tight">VyaparBook</h2>
          </div>
          <p className="text-purple-100 text-sm mb-8 font-medium opacity-80">Join us to manage all Your Logistic needs</p>

          {/* Hero Image Container */}
          <div className="relative mt-auto flex justify-center items-end h-full max-h-[450px]">
            <img 
              src="/images/login-hero.png" 
              alt="Professional using laptop" 
              className="w-full h-full object-contain object-bottom transform scale-110 translate-y-4"
            />
            
            {/* Floating Info Cards */}
            <div className="absolute top-[10%] left-[-5%] bg-white rounded-xl p-3 shadow-lg flex items-center gap-3 animate-pulse shadow-purple-900/20">
              <div className="bg-purple-100 p-2 rounded-lg text-[#6D28D9]"><Zap size={18} /></div>
              <div className="pr-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">Fast</p>
                <p className="text-xs text-gray-900 font-extrabold leading-tight">Setup</p>
              </div>
            </div>

            <div className="absolute bottom-[20%] left-[5%] bg-white rounded-xl p-3 shadow-lg flex items-center gap-3 shadow-purple-900/20">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-500"><ShieldCheck size={18} /></div>
              <div className="pr-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">Secure</p>
                <p className="text-xs text-gray-900 font-extrabold leading-tight">Storage</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="w-full md:w-[50%] bg-transparent p-4 md:p-8 flex items-center justify-center relative">
          <div className="bg-white w-full rounded-[48px] p-8 md:p-10 shadow-xl flex flex-col overflow-y-auto max-h-[90vh]">
            <h3 className="text-[#4B2A85] text-3xl font-extrabold mb-1">Create Account</h3>
            <p className="text-purple-400 text-sm mb-6 font-semibold">Join the VyaparBook ecosystem</p>

            {error && (
              <div className="mb-4 px-4 py-2 bg-red-50 border border-red-100 text-red-500 text-xs rounded-lg font-medium">{error}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#4B2A85] text-xs font-bold mb-1.5 ml-1 uppercase tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    placeholder="John"
                    {...register("firstName")}
                    className={`w-full px-5 py-2.5 rounded-2xl bg-gray-50 border ${errors.firstName ? "border-red-400" : "border-gray-100"} text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-medium`}
                  />
                </div>
                <div>
                  <label className="block text-[#4B2A85] text-xs font-bold mb-1.5 ml-1 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Doe"
                    {...register("lastName")}
                    className={`w-full px-5 py-2.5 rounded-2xl bg-gray-50 border ${errors.lastName ? "border-red-400" : "border-gray-100"} text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-medium`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4B2A85] text-xs font-bold mb-1.5 ml-1 uppercase tracking-wider">Email</label>
                <input 
                  type="email" 
                  placeholder="john@example.com"
                  {...register("email")}
                  className={`w-full px-5 py-2.5 rounded-2xl bg-gray-50 border ${errors.email ? "border-red-400" : "border-gray-100"} text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-medium`}
                />
              </div>

              <div>
                <label className="block text-[#4B2A85] text-xs font-bold mb-1.5 ml-1 uppercase tracking-wider">Phone</label>
                <input 
                  type="tel" 
                  placeholder="+91 98765 43210"
                  {...register("phone")}
                  className={`w-full px-5 py-2.5 rounded-2xl bg-gray-50 border ${errors.phone ? "border-red-400" : "border-gray-100"} text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-medium`}
                />
              </div>

              <div>
                <label className="block text-[#4B2A85] text-xs font-bold mb-1.5 ml-1 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input 
                    type={showPw ? "text" : "password"} 
                    placeholder="••••••••"
                    {...register("password")}
                    className={`w-full px-5 py-2.5 rounded-2xl bg-gray-50 border ${errors.password ? "border-red-400" : "border-gray-100"} text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-medium`}
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

              <div>
                <label className="block text-[#4B2A85] text-xs font-bold mb-1.5 ml-1 uppercase tracking-wider">Confirm Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={`w-full px-5 py-2.5 rounded-2xl bg-gray-50 border ${errors.confirmPassword ? "border-red-400" : "border-gray-100"} text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-medium`}
                />
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-200 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight size={18} /></>}
                </button>
                <div className="text-center">
                  <p className="text-xs text-gray-400 font-bold tracking-tight">
                    Already have an account? <Link href="/login"><a className="text-[#6D28D9] font-extrabold hover:underline">Sign In</a></Link>
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

